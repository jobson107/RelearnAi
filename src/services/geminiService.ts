
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizData, Flashcard, DeepDiveData, WebResource, AnalysisDepth, RoadmapData, ExamType, StudyStrategy } from "../types";
import * as Fallback from "../utils/fallbackGenerator";

declare global {
  interface Window {
    pdfjsLib: any;
    webkitAudioContext: typeof AudioContext;
  }
}

// Initialize Gemini Client
// We assume process.env.API_KEY is available. If not, calls will fail and trigger fallback.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "dummy_key" });

// --- Helpers for Retry & Fallback ---

const getConsent = (): boolean => {
  const consent = localStorage.getItem('relearn_cloud_consent');
  // Default to false if not set (user must explicitly allow)
  return consent === 'true'; 
};

// Retry logic wrapper
async function withRetry<T>(
  operation: () => Promise<T>, 
  fallbackFn: () => T,
  label: string
): Promise<{ data: T, isFallback: boolean, error?: string }> {
  
  if (!getConsent()) {
    console.warn(`[GeminiService] Cloud assist disabled. Using local fallback for ${label}.`);
    return { data: fallbackFn(), isFallback: true };
  }

  let attempts = 0;
  const maxAttempts = 3;
  const backoff = [500, 1500, 4500];

  while (attempts < maxAttempts) {
    try {
      const result = await operation();
      return { data: result, isFallback: false };
    } catch (error: any) {
      attempts++;
      console.error(`[GeminiService] ${label} failed (Attempt ${attempts}/${maxAttempts}):`, error);

      // Handle specific HTTP errors
      const msg = error.toString().toLowerCase();
      if (msg.includes('401') || msg.includes('403') || msg.includes('key')) {
        console.error("Authentication Error: Check API Key.");
        // Don't retry auth errors
        return { data: fallbackFn(), isFallback: true, error: "Authentication Error" };
      }
      
      if (msg.includes('429') || msg.includes('quota')) {
         console.warn("Rate Limited. Waiting longer...");
         await new Promise(r => setTimeout(r, 2000)); // Extra wait for rate limit
      }

      if (attempts === maxAttempts) {
        console.error(`[GeminiService] Final failure for ${label}. Switching to fallback.`);
        return { 
            data: fallbackFn(), 
            isFallback: true, 
            error: "Service unavailable" 
        };
      }

      // Exponential backoff
      await new Promise(r => setTimeout(r, backoff[attempts - 1]));
    }
  }
  
  return { data: fallbackFn(), isFallback: true };
}

// --- Audio Context ---
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') {
    throw new Error("Window not available for AudioContext");
  }
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// --- Live API Helpers ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export interface VoiceChatControl {
    stop: () => void;
}

export const startVoiceChat = (
    onVolume: (level: number) => void,
    onStatusChange: (status: 'connecting' | 'connected' | 'error' | 'disconnected') => void
): VoiceChatControl => {
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();
    let inputContext: AudioContext | null = null;
    let outputContext: AudioContext | null = null;
    let inputStream: MediaStream | null = null;
    let session: any = null;
    let isStopped = false;

    // Helper to cleanup
    const cleanup = () => {
        if (isStopped) return;
        isStopped = true;
        session?.close();
        inputContext?.close();
        outputContext?.close();
        inputStream?.getTracks().forEach(t => t.stop());
        sources.forEach(s => s.stop());
        onStatusChange('disconnected');
    };

    (async () => {
        try {
            onStatusChange('connecting');
            inputContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            
            inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.log('Live Session Opened');
                        onStatusChange('connected');
                        
                        // Start Input Stream
                        if (!inputContext || !inputStream) return;
                        const source = inputContext.createMediaStreamSource(inputStream);
                        const processor = inputContext.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            if (isStopped) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Calculate volume for UI
                            let sum = 0;
                            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                            const rms = Math.sqrt(sum / inputData.length);
                            onVolume(Math.min(1, rms * 5)); // Amplify for UI visibility

                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                        };

                        source.connect(processor);
                        processor.connect(inputContext.destination);
                    },
                    onmessage: async (message: any) => {
                        if (isStopped) return;
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        
                        if (base64Audio && outputContext) {
                            nextStartTime = Math.max(nextStartTime, outputContext.currentTime);
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                outputContext,
                                24000,
                                1
                            );
                            
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.addEventListener('ended', () => {
                                sources.delete(source);
                            });
                            
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            sources.forEach(s => s.stop());
                            sources.clear();
                            nextStartTime = 0;
                        }
                    },
                    onclose: () => cleanup(),
                    onerror: (e) => {
                        console.error('Live API Error', e);
                        onStatusChange('error');
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: "You are Synapse, a friendly and enthusiastic AI tutor. Engage the student with questions and short, encouraging responses. Keep it conversational."
                }
            });

            session = await sessionPromise;

        } catch (error) {
            console.error("Failed to start voice chat", error);
            onStatusChange('error');
            cleanup();
        }
    })();

    return { stop: cleanup };
};

// --- Exports ---

export const extractTextFromPDF = async (file: File): Promise<string> => {
  if (typeof window === 'undefined') return "";
  if (!window.pdfjsLib) throw new Error("PDF.js library not loaded");
  if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } catch (e) { console.error("PDF Extraction failed", e); throw new Error("Failed to parse PDF"); }
};

export const createTutorChat = () => {
    // Chat doesn't easily support retry middleware in this structure, 
    // but we can wrap the creation or handling in the component.
    // For now, return the client directly.
    return ai.chats.create({ 
        model: 'gemini-3-pro-preview', 
        config: { 
            systemInstruction: `You are ReLearn, an expert AI Study Companion powered by Gemini 3 Pro. Use chain-of-thought to break down complex student queries. Always format mathematical formulas using LaTeX syntax. Enclose inline formulas in \\( ... \\) and block formulas in \\[ ... \\].`, 
            tools: [{ googleSearch: {} }] 
        } 
    });
};

export const generateSummary = (text: string, depth: AnalysisDepth): Promise<{ data: string, isFallback: boolean }> => {
  return withRetry(
    async () => {
        const depthInstruction = depth === AnalysisDepth.DEEP_DIVE ? "Integrate high-yield context from your broad knowledge." : "STRICTLY use ONLY the provided notes.";
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `You are an elite Entrance Exam Coach. First, analyze the provided text to identify the core arguments and concept hierarchy. Then, ${depthInstruction} Transform these notes into a high-yield exam prep summary. Use clear headings, bullet points, and bold text for key terms. Important: When including mathematical formulas or equations, you MUST use LaTeX formatting. Enclose inline math in \\( ... \\) and block math in \\[ ... \\]. NOTES: ${text.substring(0, 30000)}`,
        config: { temperature: 0.3 }
        });
        return response.text || "Failed to generate summary.";
    },
    () => Fallback.generateLocalSummary(text),
    "Summary Generation"
  );
};

export const generateStudyAdvice = (text: string): Promise<{ data: StudyAdvice, isFallback: boolean }> => {
  return withRetry(
    async () => {
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this study material and provide meta-learning advice. 
        1. Identify 3 specific study strategies (e.g. "Use the Loci method for the list of dates").
        2. Provide 1 personalized "Micro-Advice" tip (e.g. "Focus deeply on the second paragraph's definition").
        Ensure any math is LaTeX formatted.
        Text: ${text.substring(0, 15000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                microAdvice: { type: Type.STRING }
            },
            required: ["strategies", "microAdvice"]
            }
        }
        });
        return JSON.parse(response.text || '{"strategies": [], "microAdvice": ""}') as StudyAdvice;
    },
    () => Fallback.generateLocalStudyAdvice(),
    "Study Advice"
  );
};

export const generateDeepDive = (text: string, depth: AnalysisDepth): Promise<{ data: DeepDiveData | null, isFallback: boolean }> => {
  if (depth === AnalysisDepth.NOTES_ONLY || !text) return Promise.resolve({ data: null, isFallback: false });
  
  return withRetry(
    async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: `Perform a deep dive research on the key difficult concepts in this text. Identify ambiguities and resolve them with latest data. Use proper LaTeX for any math. Text: ${text.substring(0, 2000)}`,
            config: { tools: [{ googleSearch: {} }] },
        });
        const content = response.text || "Unable to retrieve deep dive info.";
        const resources: WebResource[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        chunks.forEach((chunk: any) => { if (chunk.web?.uri && chunk.web?.title) resources.push({ title: chunk.web.title, uri: chunk.web.uri }); });
        const uniqueResources = resources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
        return { content, resources: uniqueResources.slice(0, 5) };
    },
    () => null, // No local fallback for deep dive web search
    "Deep Dive"
  );
};

export const generateVisualAnalogy = (text: string): Promise<{ data: { imageUrl: string; prompt: string }, isFallback: boolean }> => {
  return withRetry(
    async () => {
        // 1. Generate Reasoning-Based Prompt
        const promptResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a vivid, concrete visual analogy to explain the following concept. Think about the structural relationships. Output ONLY the image generation prompt. Concept: ${text.substring(0, 800)}. Style: Isometric, neon-tech, educational diagram.`,
        });
        const imagePrompt = promptResponse.text || "Futuristic educational diagram";
        
        // 2. Generate Image
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', contents: imagePrompt, config: {},
        });
        let imageUrl = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) { imageUrl = `data:image/png;base64,${part.inlineData.data}`; break; }
        }
        if (!imageUrl) throw new Error("No image data");
        return { imageUrl, prompt: imagePrompt };
    },
    () => ({ imageUrl: "", prompt: "Visual generation unavailable in offline/fallback mode." }),
    "Visual Analogy"
  );
};

export const editImage = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    // Basic base64 cleanup
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.match(/^data:([^;]+);/)?.[1] || 'image/png';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated from edit");
  } catch (error) {
    console.error("Image editing error:", error);
    throw error;
  }
};

export const generateQuiz = (text: string, depth: AnalysisDepth): Promise<{ data: QuizData, isFallback: boolean }> => {
  return withRetry(
    async () => {
        const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Create a hard 5-question multiple choice quiz. Use chain-of-thought to identify common misconceptions and use them as distractors. Ensure ALL math formulas in questions, options, or explanations are formatted with LaTeX (e.g. \\( x^2 \\)). Text: ${text.substring(0, 20000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctAnswerIndex", "explanation"] } }
            },
            required: ["title", "questions"]
            }
        }
        });
        return JSON.parse(response.text || "{}") as QuizData;
    },
    () => Fallback.generateLocalQuiz(text),
    "Quiz Generation"
  );
};

export const generateFlashcards = (text: string): Promise<{ data: Flashcard[], isFallback: boolean }> => {
  return withRetry(
    async () => {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 8 'Hard' flashcards. Focus on key definitions and causal relationships. If equations or math are involved, use LaTeX formatting \\( ... \\). Text: ${text.substring(0, 10000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING } }, required: ["front", "back"] }
            }
        }
        });
        return JSON.parse(response.text || "[]") as Flashcard[];
    },
    () => Fallback.generateLocalFlashcards(text),
    "Flashcard Generation"
  );
};

export const generateConceptMap = (text: string): Promise<{ data: ConceptMapData, isFallback: boolean }> => {
  return withRetry(
    async () => {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract key concepts and their relationships from the text for a mind map. Return JSON. Text: ${text.substring(0, 15000)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    importance: { type: Type.INTEGER },
                    category: { type: Type.STRING },
                    connections: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["id", "label", "importance", "category", "connections"]
                }
                }
            },
            required: ["nodes"]
            }
        }
        });
        return JSON.parse(response.text || '{"nodes": []}') as ConceptMapData;
    },
    () => Fallback.generateLocalConceptMap(text),
    "Concept Map"
  );
};

export const generateStudyRoadmap = (text: string, examType: string = 'General', strategy: string = 'Balanced'): Promise<{ data: RoadmapData, isFallback: boolean }> => {
    return withRetry(
        async () => {
            const prompt = `
            Act as an elite exam coach using Gemini 3 Pro reasoning. Create a personalized study roadmap.
            Exam Type: ${examType}
            Strategy: ${strategy}
            Content: ${text.substring(0, 15000)}
            Format strictly as JSON.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', 
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }], 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            examType: { type: Type.STRING },
                            strategy: { type: Type.STRING },
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        week: { type: Type.STRING },
                                        day: { type: Type.STRING },
                                        topic: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        taskType: { type: Type.STRING, enum: ['Learn', 'Revise', 'Test'] },
                                        estimatedMinutes: { type: Type.INTEGER },
                                        difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                                        prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        microtasks: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    text: { type: Type.STRING },
                                                    completed: { type: Type.BOOLEAN }
                                                }
                                            }
                                        },
                                        xp: { type: Type.INTEGER },
                                        status: { type: Type.STRING, enum: ['pending', 'in-progress', 'completed'] }
                                    },
                                    required: ["id", "week", "day", "topic", "description", "taskType", "estimatedMinutes", "difficulty", "microtasks", "xp", "status"]
                                }
                            }
                        },
                        required: ["items"]
                    }
                }
            });
            const jsonStr = response.text || '{"items": []}';
            return JSON.parse(jsonStr) as RoadmapData;
        },
        () => Fallback.generateLocalRoadmap(text),
        "Roadmap Generation"
    );
};

export const playTextToSpeech = async (text: string): Promise<AudioBufferSourceNode> => {
  if (!text) throw new Error("No text to speak");
  if (!getConsent()) throw new Error("Cloud assist disabled - TTS unavailable");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 800) }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data generated");
    
    let ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const float32Data = new Float32Array(bytes.length / 2);
    const dataInt16 = new Int16Array(bytes.buffer);
    for (let i = 0; i < dataInt16.length; i++) float32Data[i] = dataInt16[i] / 32768.0;
    
    const buffer = ctx.createBuffer(1, float32Data.length, 24000);
    buffer.copyToChannel(float32Data, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    return source;
  } catch (error) { throw error; }
};
