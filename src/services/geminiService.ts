
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizData, Flashcard, DeepDiveData, WebResource, AnalysisDepth, RoadmapData, StudyAdvice, ConceptMapData } from "../types";
import * as Fallback from "../utils/fallbackGenerator";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "dummy_key" });

// --- Audio Context ---
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') {
    throw new Error("Window not available");
  }
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// --- Helper: Clean JSON ---
const cleanJSON = (text: string): any => {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    try {
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            return JSON.parse(text.substring(firstOpen, lastClose + 1));
        }
        const firstArray = text.indexOf('[');
        const lastArray = text.lastIndexOf(']');
        if (firstArray !== -1 && lastArray !== -1) {
            return JSON.parse(text.substring(firstArray, lastArray + 1));
        }
    } catch (e2) {}
    // Don't throw loudly, just return null so caller handles it
    return null;
  }
};

// --- Live API Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function createBlob(data: Float32Array): any {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

export interface VoiceChatControl { stop: () => void; }

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
            inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        onStatusChange('connected');
                        if (!inputContext || !inputStream) return;
                        const source = inputContext.createMediaStreamSource(inputStream);
                        const processor = inputContext.createScriptProcessor(4096, 1, 1);
                        processor.onaudioprocess = (e) => {
                            if (isStopped) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            let sum = 0;
                            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                            onVolume(Math.min(1, Math.sqrt(sum / inputData.length) * 5));
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
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext, 24000, 1);
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                            source.addEventListener('ended', () => sources.delete(source));
                        }
                    },
                    onclose: () => cleanup(),
                    onerror: (e) => { console.error('Live API Error', e); onStatusChange('error'); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: "You are ReLearn, a friendly AI tutor. Engage the student with questions and short, encouraging responses."
                }
            });
            session = await sessionPromise;
        } catch (error) { console.error("Voice Chat Failed", error); onStatusChange('error'); cleanup(); }
    })();
    return { stop: cleanup };
};

// --- Standard Generators ---

async function safeGen<T>(label: string, op: () => Promise<T>, fallback: T): Promise<{ data: T, isFallback: boolean }> {
    try {
        const res = await op();
        return { data: res, isFallback: false };
    } catch (e: any) {
        // Only log serious errors, not expected rate limits
        const msg = e.message || JSON.stringify(e);
        if (msg.includes('429') || e.status === 429) {
             console.warn(`${label}: Offline fallback triggered (Rate Limit)`);
        } else {
             console.warn(`${label}: Offline fallback triggered (Error)`);
        }
        return { data: fallback, isFallback: true };
    }
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  if (typeof window === 'undefined') return "";
  if (!(window as any).pdfjsLib) throw new Error("PDF.js library not loaded");
  if (!(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc) (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } catch (e) { throw new Error("Failed to parse PDF"); }
};

export const createTutorChat = () => ai.chats.create({ 
    model: 'gemini-3-pro-preview', 
    config: { 
        systemInstruction: `You are ReLearn, an expert AI Study Companion. Format math with LaTeX: inline \\( ... \\), block \\[ ... \\].`, 
        tools: [{ googleSearch: {} }] 
    } 
});

export const generateSummary = (text: string, depth: AnalysisDepth) => safeGen('Summary', async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Analyze and summarize. Use LaTeX for math. Text: ${text.substring(0, 30000)}`,
    });
    return response.text || "Summary unavailable.";
}, Fallback.generateLocalSummary(text));

export const generateStudyAdvice = (text: string) => safeGen('Advice', async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Provide study strategies JSON for this text. Text: ${text.substring(0, 10000)}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { strategies: { type: Type.ARRAY, items: { type: Type.STRING } }, microAdvice: { type: Type.STRING } } } }
    });
    const parsed = cleanJSON(response.text || '{}') || {};
    return { strategies: parsed.strategies || [], microAdvice: parsed.microAdvice || "" } as StudyAdvice;
}, Fallback.generateLocalStudyAdvice());

export const generateQuiz = (text: string, depth: AnalysisDepth) => safeGen('Quiz', async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Create hard 5-question JSON quiz. Use LaTeX for math. Text: ${text.substring(0, 20000)}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } } } } } } }
    });
    const parsed = cleanJSON(response.text || '{}') || {};
    if (!Array.isArray(parsed.questions)) parsed.questions = [];
    return { title: parsed.title || "Quiz", questions: parsed.questions } as QuizData;
}, Fallback.generateLocalQuiz(text));

export const generateFlashcards = (text: string) => safeGen('Flashcards', async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 8 flashcards JSON. Text: ${text.substring(0, 10000)}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING } } } } }
    });
    const parsed = cleanJSON(response.text || '[]') || [];
    return Array.isArray(parsed) ? parsed : [];
}, Fallback.generateLocalFlashcards(text));

export const generateConceptMap = (text: string) => safeGen('ConceptMap', async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract key concepts for mind map JSON. Text: ${text.substring(0, 15000)}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, importance: { type: Type.INTEGER }, category: { type: Type.STRING }, connections: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } } }
    });
    const parsed = cleanJSON(response.text || '{}') || {};
    return { nodes: parsed.nodes || [] } as ConceptMapData;
}, Fallback.generateLocalConceptMap(text));

export const generateVisualAnalogy = (text: string) => safeGen('Visual', async () => {
    const promptRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create image prompt for educational analogy. Concept: ${text.substring(0, 800)}`,
    });
    const prompt = promptRes.text || "Educational diagram";
    const imgRes = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: prompt });
    const part = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return { imageUrl: part ? `data:image/png;base64,${part.inlineData.data}` : "", prompt };
}, { imageUrl: "", prompt: "Offline mode" });

export const editImage = async (imageBase64: string, prompt: string): Promise<string> => {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = imageBase64.match(/^data:([^;]+);/)?.[1] || 'image/png';
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Edit failed");
};

export const generateDeepDive = (text: string, depth: AnalysisDepth) => safeGen('DeepDive', async () => {
    if (depth === AnalysisDepth.NOTES_ONLY) return null;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Deep dive research. Text: ${text.substring(0, 2000)}`,
        config: { tools: [{ googleSearch: {} }] },
    });
    const resources: WebResource[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
        if (chunk.web?.uri) resources.push({ title: chunk.web.title, uri: chunk.web.uri });
    });
    return { content: response.text || "", resources: resources.slice(0, 5) };
}, null);

export const generateStudyRoadmap = (text: string) => safeGen('Roadmap', async () => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: `Create study roadmap JSON. Text: ${text.substring(0, 15000)}`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { examType: { type: Type.STRING }, strategy: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, week: { type: Type.STRING }, day: { type: Type.STRING }, topic: { type: Type.STRING }, description: { type: Type.STRING }, taskType: { type: Type.STRING }, estimatedMinutes: { type: Type.INTEGER }, difficulty: { type: Type.STRING }, prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } }, microtasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING }, completed: { type: Type.BOOLEAN } } } }, xp: { type: Type.INTEGER }, status: { type: Type.STRING } } } } } } }
    });
    const parsed = cleanJSON(response.text || '{}') || {};
    return { examType: parsed.examType || "General", strategy: parsed.strategy || "Balanced", items: parsed.items || [] } as RoadmapData;
}, Fallback.generateLocalRoadmap(text));

// Veo Video Generation
export const generateGeminiAnimation = async (topic: string, summary: string): Promise<string | null> => {
    try {
        const op = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Educational animation: ${topic}. Context: ${summary.substring(0, 100)}`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });
        
        let operation = op;
        let attempts = 0;
        // Poll for completion
        while (!operation.done && attempts < 10) {
            await new Promise(r => setTimeout(r, 2000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            attempts++;
        }
        
        const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
        return uri ? `${uri}&key=${process.env.API_KEY}` : null;
    } catch (e) {
        console.error("Veo Gen Failed", e);
        return null;
    }
};

export const playTextToSpeech = async (text: string) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 800) }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } },
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("No audio");
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    return source;
};
