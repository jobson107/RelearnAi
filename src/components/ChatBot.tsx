
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ExternalLink, Minimize2, Maximize2 } from 'lucide-react';
import { createTutorChat } from '../services/geminiService';
import { ChatMessage, WebResource } from '../types';
import { GenerateContentResponse } from '@google/genai';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm ReLearn, your AI Tutor. I can search the web for answers, find research papers, or teach you the *best* ways to study (like Active Recall!). What do you need help with?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Relax type to avoid SDK conflicts if 'Chat' isn't explicitly exported as type
  const [chatSession, setChatSession] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session on mount
  useEffect(() => {
    try {
      const session = createTutorChat();
      setChatSession(session);
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !chatSession) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const result: GenerateContentResponse = await chatSession.sendMessage({ message: userText });
      const responseText = result.text || "I couldn't find an answer to that.";
      
      // Extract grounding sources if any
      const sources: WebResource[] = [];
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

      const newBotMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
        sources: uniqueSources.length > 0 ? uniqueSources : undefined
      };

      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error while searching. Please try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMarkdown = (text: string) => {
    // Simple parser for bolding and bullet points in chat
    return text.split('\n').map((line, i) => {
        const key = `${i}-${line.substring(0, 10)}`;
        if (line.startsWith('* ') || line.startsWith('- ')) {
            return <li key={key} className="ml-4 list-disc">{renderBold(line.substring(2))}</li>
        }
        if (line.match(/^\d+\./)) {
             return <div key={key} className="ml-4 mb-1">{renderBold(line)}</div>
        }
        if (line.trim() === '') return <br key={key} />;
        return <p key={key} className="mb-1">{renderBold(line)}</p>;
    });
  };

  const renderBold = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="text-indigo-600 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
          }
          return part;
      });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white animate-bounce'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[75vh] glass-panel bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2rem] shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border-b border-white/50 dark:border-slate-700 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                     <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <div>
                     <h3 className="font-bold text-slate-800 dark:text-white">ReLearn AI Tutor</h3>
                     <div className="flex items-center gap-1.5">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Search Active</span>
                     </div>
                 </div>
             </div>
             <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-indigo-500 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                        } ${msg.isError ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' : ''}`}
                    >
                        {msg.role === 'model' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {renderMarkdown(msg.text)}
                            </div>
                        ) : (
                            msg.text
                        )}

                        {/* Search Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sources Found:</p>
                                <div className="space-y-1">
                                    {msg.sources.slice(0, 3).map((source, idx) => (
                                        <a 
                                            key={idx} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                                        >
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{source.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
            <form onSubmit={handleSendMessage} className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about study tips or search web..."
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl pl-4 pr-12 py-3.5 text-sm outline-none transition-all dark:text-white"
                />
                <button 
                    type="submit" 
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </form>
            <p className="text-center text-[10px] text-slate-400 mt-2">
                ReLearn AI can make mistakes. Verify important info.
            </p>
        </div>

      </div>
    </>
  );
};
