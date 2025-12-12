
import { AppState, VideoResult } from '../types';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Calculates simple TF-IDF similarity between query and text
 */
const calculateSimilarity = (query: string, text: string): number => {
  const qTokens = query.toLowerCase().split(/\s+/);
  const tTokens = text.toLowerCase().split(/\s+/);
  let matches = 0;
  qTokens.forEach(t => {
    if (tTokens.includes(t)) matches++;
  });
  return matches / Math.max(qTokens.length, 1);
};

export const searchLocalAssets = async (query: string, appState: AppState): Promise<VideoResult[]> => {
  const results: VideoResult[] = [];

  // 1. Search Visual Analogy
  if (appState.visualUrl && appState.visualPrompt) {
    const similarity = calculateSimilarity(query, appState.visualPrompt);
    if (similarity > 0.1) {
      results.push({
        id: 'local-visual',
        title: 'Generated Visual Analogy',
        description: appState.visualPrompt.substring(0, 100) + '...',
        thumbnail: appState.visualUrl,
        url: appState.visualUrl, // Treating image as a "static" video for this context
        source: 'local',
        duration: 'Image',
        relevance: similarity
      });
    }
  }

  // 2. Search Roadmap Resources
  if (appState.roadmap?.items) {
    appState.roadmap.items.forEach(item => {
      const topicSim = calculateSimilarity(query, item.topic);
      const descSim = calculateSimilarity(query, item.description);
      
      if (topicSim > 0.1 || descSim > 0.1) {
        // Check if node has resources
        item.resources.forEach((res, idx) => {
           // Mocking a local resource match
           results.push({
             id: `local-node-${item.id}-${idx}`,
             title: res.title,
             description: res.snippet || `Resource for ${item.topic}`,
             thumbnail: 'https://via.placeholder.com/150?text=Resource', // Fallback
             url: res.uri,
             source: 'local',
             duration: 'Link',
             relevance: Math.max(topicSim, descSim)
           });
        });
      }
    });
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 6);
};

export const searchYouTube = async (query: string, apiKey?: string): Promise<VideoResult[]> => {
  if (!apiKey) {
    return [
        {
            id: 'yt-mock-1',
            title: `Introduction to ${query} (Demo)`,
            description: 'This is a simulated result. Add API key for real data.',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            source: 'youtube',
            duration: '10:00',
            relevance: 0.95
        }
    ];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );

    if (!response.ok) throw new Error("YouTube API request failed");
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'youtube',
      duration: 'Unknown',
      relevance: 1 
    }));

  } catch (error) {
    console.error("YouTube Search Error:", error);
    return [];
  }
};

interface AnimationRequest {
  topic: string;
  summary: string;
  style?: string;
}

export const generateGeminiAnimation = async (
  request: AnimationRequest, 
  cloudAssistEnabled: boolean,
  confirmCallback: () => Promise<boolean>
): Promise<VideoResult | null> => {
  
  if (!cloudAssistEnabled) throw new Error("Cloud Assist is disabled.");
  const confirmed = await confirmCallback();
  if (!confirmed) return null;

  try {
    // 1. Generate Storyboard Script using Gemini 3 Pro
    const scriptResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an educational video producer. Create a concise, highly visual video generation prompt for Veo to explain this topic: "${request.topic}". 
      Context: ${request.summary.substring(0, 200)}. 
      Format: Output ONLY the prompt text for the video generation model.`,
    });
    
    const veoPrompt = scriptResponse.text || `Educational animation about ${request.topic}`;

    // 2. Generate Video with Veo
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${veoPrompt} ${request.style || 'cinematic lighting, high definition, educational style'}`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    let op = operation;
    let attempts = 0;
    while (!op.done && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        op = await ai.operations.getVideosOperation({ operation: op });
        attempts++;
    }

    const videoUri = op.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
        return {
            id: `gemini-${Date.now()}`,
            title: `AI Explainer: ${request.topic}`,
            description: `Generated by Gemini Veo based on: ${veoPrompt.substring(0, 60)}...`,
            thumbnail: 'https://via.placeholder.com/320x180?text=AI+Generated+Video',
            url: `${videoUri}&key=${process.env.API_KEY}`,
            source: 'gemini',
            duration: '00:06',
            relevance: 1
        };
    }
    throw new Error("Video generation incomplete");
  } catch (error) {
    console.error("Gemini Animation Error:", error);
    return null;
  }
};
