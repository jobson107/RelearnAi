
import { VideoResult } from '../types';

export const searchYouTube = async (query: string, apiKey?: string): Promise<VideoResult[]> => {
  if (!apiKey) {
    // Return a dummy result or empty if strictly enforcing key
    console.warn("No YouTube API Key provided. Returning mock data.");
    // For demo purposes, returning mock data so the UI can be tested without a real key
    return [
        {
            id: 'yt-mock-1',
            title: `Introduction to ${query} (Demo Result)`,
            description: 'This is a simulated YouTube result. Add a valid API key to fetch real data.',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            source: 'youtube',
            duration: '10:00',
            relevance: 0.95
        },
        {
            id: 'yt-mock-2',
            title: `Advanced ${query} Concepts`,
            description: 'Deep dive into the topic with expert analysis.',
            thumbnail: 'https://img.youtube.com/vi/5qap5aO4i9A/0.jpg',
            url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
            source: 'youtube',
            duration: '15:30',
            relevance: 0.8
        }
    ];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
    );

    if (!response.ok) {
        throw new Error("YouTube API request failed");
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'youtube',
      duration: 'Unknown', // Duration requires a separate API call (videos endpoint), skipping for simplicity
      relevance: 1 // API sorts by relevance by default
    }));

  } catch (error) {
    console.error("YouTube Search Error:", error);
    return [];
  }
};
