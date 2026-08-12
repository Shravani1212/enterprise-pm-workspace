import React, { useState } from 'react';
import { Bot, Send, Sparkles, User as UserIcon, Code2, Database } from 'lucide-react';
import apiClient from '../services/apiClient';
import { ApiResponse } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  actionExecuted?: string;
  data?: any;
}

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: '🤖 Hello! I am your AI Project Assistant. How can I help analyze project health or summarize tasks today?',
      actionExecuted: 'NONE',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiClient.post<ApiResponse<{ reply: string; actionExecuted: string; data: any }>>(
        '/ai/chat',
        { projectId: 1, message: currentInput }
      );

      if (res.data.success && res.data.data) {
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: res.data.data.reply,
          actionExecuted: res.data.data.actionExecuted,
          data: res.data.data.data,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: '🤖 System error connecting to AI Assistant backend.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-accent flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Project Assistant</h2>
          <p className="text-xs text-slate-500 font-medium">
            Natural language project intelligence with secure function calling.
          </p>
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="flex-1 glass-panel rounded-2xl border border-slate-200 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                msg.sender === 'user' ? 'bg-gradient-primary' : 'bg-gradient-accent'
              }`}
            >
              {msg.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-primary text-white shadow-md shadow-indigo-500/10'
                  : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

              {msg.actionExecuted && msg.actionExecuted !== 'NONE' && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  <span>Executed Tool: {msg.actionExecuted}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Bot className="h-4 w-4 animate-bounce text-sky-500" />
            <span>AI Assistant is analyzing project data...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Assistant e.g. 'Give me a project summary' or 'Search tasks'..."
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-gradient-accent hover:opacity-95 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
