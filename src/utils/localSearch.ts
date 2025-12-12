
import { AppState, VideoResult } from '../types';

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

  // Mock some "stored animation snippets" for demonstration if query matches generic terms
  if (query.toLowerCase().includes('cell') || query.toLowerCase().includes('biology')) {
      results.push({
          id: 'local-mock-1',
          title: 'Cell Mitosis Animation (Cached)',
          description: 'Previously generated animation of cell division phases.',
          thumbnail: 'https://img.youtube.com/vi/ofjyw7ARP1c/0.jpg', // Placeholder
          url: '#',
          source: 'local',
          duration: '00:45',
          relevance: 0.9
      });
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 6);
};
