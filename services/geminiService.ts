
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizData, Flashcard, DeepDiveData, WebResource, AnalysisDepth, RoadmapData, ExamType, StudyStrategy } from "../types";

declare global {
  interface Window {
    pdfjsLib: any;
    webkitAudioContext: typeof AudioContext;
  }
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Cache Implementation ---
const apiCache = new Map<string, Promise<any>>();

const getCacheKey = (type: string, text: string, options: any = ''): string => {
  if (!text) return `${type}:empty`;
  const textHash = `${text.length}-${text.substring(0, 32)}`;
  return `${type}:${textHash}:${JSON.stringify(options)}`;
};

const withCache = async <T>(
  key: string, 
  operation: () => Promise<T>
): Promise<T> => {
  if (apiCache.has(key)) {
    return apiCache.get(key) as Promise<T>;
  }
  const promise = operation().catch(err => {
    apiCache.delete(key);
    throw err;
  });
  apiCache.set(key, promise);
  return promise;
};

// Audio Context Singleton
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

// ... (Other service functions: extractTextFromPDF, createTutorChat, generateSummary, generateDeepDive, generateVisualAnalogy, generateQuiz, generateFlashcards, playTextToSpeech) ...

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

export const createTutorChat = () => ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: `You are Synapse, an expert AI Study Companion.`, tools: [{ googleSearch: {} }] } });

export const generateSummary = (text: string, depth: AnalysisDepth): Promise<string> => {
  if (!text) return Promise.resolve("");
  const key = getCacheKey('summary', text, depth);
  return withCache(key, async () => {
    const depthInstruction = depth === AnalysisDepth.DEEP_DIVE ? "Supplement with external high-yield context." : "STRICTLY use ONLY the provided notes.";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an elite Entrance Exam Coach. ${depthInstruction} Transform these notes into a high-yield exam prep summary. NOTES: ${text.substring(0, 30000)}`,
      config: { temperature: 0.3 }
    });
    return response.text || "Failed to generate summary.";
  });
};

export const generateDeepDive = (text: string, depth: AnalysisDepth): Promise<DeepDiveData | null> => {
  if (depth === AnalysisDepth.NOTES_ONLY || !text) return Promise.resolve(null);
  const key = getCacheKey('deepDive', text, depth);
  return withCache(key, async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Perform a deep dive research on the key difficult concepts in this text. Text: ${text.substring(0, 2000)}`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const content = response.text || "Unable to retrieve deep dive info.";
      const resources: WebResource[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      chunks.forEach((chunk: any) => { if (chunk.web?.uri && chunk.web?.title) resources.push({ title: chunk.web.title, uri: chunk.web.uri }); });
      const uniqueResources = resources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
      return { content, resources: uniqueResources.slice(0, 5) };
    } catch (error) { return { content: "Deep dive search unavailable.", resources: [] }; }
  });
};

export const generateVisualAnalogy = (text: string): Promise<{ imageUrl: string; prompt: string }> => {
  if (!text) return Promise.resolve({ imageUrl: '', prompt: '' });
  const key = getCacheKey('visual', text);
  return withCache(key, async () => {
    const promptResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a prompt for an educational diagram explains: ${text.substring(0, 500)}. Style: Isometric, neon-tech.`,
    });
    const imagePrompt = promptResponse.text || "Futuristic educational diagram";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', contents: imagePrompt, config: {},
    });
    let imageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) { imageUrl = `data:image/png;base64,${part.inlineData.data}`; break; }
    }
    if (!imageUrl) throw new Error("No image data");
    return { imageUrl, prompt: imagePrompt };
  });
};

export const generateQuiz = (text: string, depth: AnalysisDepth): Promise<QuizData> => {
  if (!text) return Promise.reject("No text provided");
  const key = getCacheKey('quiz', text, depth);
  return withCache(key, async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: `Create a hard 5-question multiple choice quiz. Text: ${text.substring(0, 20000)}`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, 
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
  });
};

export const generateFlashcards = (text: string): Promise<Flashcard[]> => {
  if (!text) return Promise.resolve([]);
  const key = getCacheKey('flashcards', text);
  return withCache(key, async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 8 'Hard' flashcards. Text: ${text.substring(0, 10000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { front: { type: Type.STRING }, back: { type: Type.STRING } }, required: ["front", "back"] }
        }
      }
    });
    return JSON.parse(response.text || "[]") as Flashcard[];
  });
};

export const playTextToSpeech = async (text: string): Promise<AudioBufferSourceNode> => {
  if (!text) throw new Error("No text to speak");
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

// --- Advanced Roadmap Generation ---
export const generateStudyRoadmap = (text: string, examType: string = 'General', strategy: string = 'Balanced'): Promise<RoadmapData> => {
    if (!text) return Promise.resolve({ examType, strategy, items: [] });
    // Use search grounding to find real resources!
    const key = getCacheKey('roadmap', text, { examType, strategy });

    return withCache(key, async () => {
        const prompt = `
        Act as an elite exam coach. Create a personalized study roadmap for:
        Exam Type: ${examType}
        Strategy: ${strategy} (Adjust pace and depth accordingly)
        Content: ${text.substring(0, 15000)}

        Structure the roadmap with 4-6 key nodes (topics). 
        Include:
        1. Task Type (Learn/Revise/Test)
        2. Estimated Time (in minutes)
        3. Difficulty (Beginner/Intermediate/Advanced)
        4. Prerequisites (what to know before this)
        5. Microtasks (3-4 actionable 5-min steps)
        6. XP (Gamification points, 10-50 based on difficulty)
        7. Resources (Video/Article search queries)

        Format strictly as JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], // ENABLE SEARCH GROUNDING
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
        const data = JSON.parse(jsonStr) as RoadmapData;
        return data; 
    });
};
