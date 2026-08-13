import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, Maximize2, Minimize2, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your Nexus AI Project Copilot. How can I assist your team today?',
    },
  ]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      let reply = "I've analyzed your workspace. You have 3 critical tasks pending in Nexus PM Platform v1.0.";
      if (userMsg.toLowerCase().includes('task') || userMsg.toLowerCase().includes('pending')) {
        reply = "⚠️ Attention: 'Fix Critical Memory Leak in Auth Token Refresh Service' is overdue by 21 days! Assigned to @dev_user.";
      } else if (userMsg.toLowerCase().includes('project')) {
        reply = "You currently have 4 active projects in your enterprise directory: NEXUS, ECM, MBA, and AIK.";
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Floating Chat Container */}
      {isOpen && (
        <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col h-[480px]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-accent flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">Nexus AI Copilot</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Intelligence Engine
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                title="Expand to Fullscreen"
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <button
              onClick={() => {
                setInput('Show overdue tasks');
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-brand-300 hover:text-brand-600 transition-colors shrink-0"
            >
              Overdue Tasks
            </button>
            <button
              onClick={() => {
                setInput('Summarize project velocity');
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-brand-300 hover:text-brand-600 transition-colors shrink-0"
            >
              Velocity Check
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-primary text-white rounded-br-none shadow-md shadow-indigo-500/10'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI Copilot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            <button
              type="submit"
              className="p-2 bg-gradient-primary hover:opacity-95 text-white rounded-xl shadow-md transition-all shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:scale-105 text-white rounded-full shadow-2xl shadow-indigo-500/30 border border-indigo-400/30 transition-all duration-300 flex items-center justify-center"
        title="Nexus AI Assistant"
      >
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
        <Sparkles className="h-6 w-6 text-sky-300 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};
