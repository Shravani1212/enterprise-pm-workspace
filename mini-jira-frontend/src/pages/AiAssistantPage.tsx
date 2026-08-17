import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react';
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
  const { projectId } = useParams<{ projectId: string }>();

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
        `/ai/projects/${projectId || 1}/chat`,
        { message: currentInput }
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
    <div className="container-fluid p-0 max-w-4xl mx-auto d-flex flex-column gap-3" style={{ height: 'calc(100vh - 10rem)', maxWidth: '900px' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-3 bg-gradient-accent d-flex align-items-center justify-center text-white shadow-sm" style={{ width: '40px', height: '40px' }}>
          <Bot style={{ width: '22px', height: '22px' }} />
        </div>
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">AI Project Assistant</h2>
          <p className="small text-muted mb-0">
            Natural language project intelligence with secure function calling.
          </p>
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="card card-glass rounded-4 border-0 p-4 flex-grow-1 overflow-auto d-flex flex-column gap-3 shadow-sm bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`d-flex align-items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`rounded-3 d-flex align-items-center justify-center text-white fw-bold shrink-0 ${
                msg.sender === 'user' ? 'bg-gradient-primary' : 'bg-gradient-accent'
              }`}
              style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
            >
              {msg.sender === 'user' ? <UserIcon style={{ width: '16px', height: '16px' }} /> : <Bot style={{ width: '16px', height: '16px' }} />}
            </div>

            <div
              className={`p-3 rounded-4 small ${
                msg.sender === 'user'
                  ? 'bg-gradient-primary text-white shadow-sm'
                  : 'bg-light text-dark border'
              }`}
              style={{ maxWidth: '75%', fontSize: '0.82rem', lineHeight: '1.45' }}
            >
              <p className="mb-0 fw-medium" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>

              {msg.actionExecuted && msg.actionExecuted !== 'NONE' && (
                <div className="mt-2 pt-2 border-top border-secondary border-opacity-10 d-flex align-items-center gap-1 small text-info fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>
                  <Sparkles style={{ width: '12px', height: '12px' }} />
                  <span>Executed Tool: {msg.actionExecuted}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="d-flex align-items-center gap-2 small fw-semibold text-muted">
            <Bot className="animate-bounce text-info" style={{ width: '16px', height: '16px' }} />
            <span>AI Assistant is analyzing project data...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Assistant e.g. 'Give me a project summary' or 'Search tasks'..."
          className="form-control bg-white border-end-0 shadow-none text-sm px-4"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn btn-primary bg-gradient-accent border-0 fw-bold px-4 text-sm d-flex align-items-center gap-2"
        >
          <span>Send</span>
          <Send style={{ width: '14px', height: '14px' }} />
        </button>
      </form>
    </div>
  );
};
