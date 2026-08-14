import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, Maximize2, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloatingAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your ProjectPulse AI Copilot. How can I assist your team today?',
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
      let reply = "I've analyzed your workspace. You have 3 critical tasks pending in ProjectPulse Platform v1.0.";
      if (userMsg.toLowerCase().includes('task') || userMsg.toLowerCase().includes('pending')) {
        reply = "⚠️ Attention: 'Fix Critical Memory Leak in Auth Token Refresh Service' is overdue by 21 days! Assigned to @dev_user.";
      } else if (userMsg.toLowerCase().includes('project')) {
        reply = "You currently have 4 active projects in your enterprise directory: NEXUS, ECM, MBA, and AIK.";
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="position-fixed bottom-0 end-0 p-4 z-3 d-flex flex-column align-items-end">
      {/* Expanded Floating Chat Container */}
      {isOpen && (
        <div
          className="card card-glass shadow-lg rounded-4 overflow-hidden animate-slide-up d-flex flex-column mb-3"
          style={{ width: '380px', maxWidth: 'calc(100vw - 2rem)', height: '480px' }}
        >
          {/* Header */}
          <div className="p-3 bg-gradient-dark-header text-white d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-3 bg-gradient-accent d-flex align-items-center justify-center text-white shadow-sm" style={{ width: '36px', height: '36px' }}>
                <Bot style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h4 className="h6 fw-bold mb-0 text-white leading-tight">ProjectPulse AI Copilot</h4>
                <div className="d-flex align-items-center gap-1.5 small text-info" style={{ fontSize: '0.7rem' }}>
                  <span className="bg-success rounded-circle d-inline-block" style={{ width: '6px', height: '6px' }}></span>
                  Active Intelligence Engine
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                title="Expand to Fullscreen"
                className="btn btn-sm btn-link text-light p-1"
              >
                <Maximize2 style={{ width: '16px', height: '16px' }} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm btn-link text-light p-1"
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center gap-2 overflow-auto" style={{ fontSize: '0.75rem' }}>
            <Lightbulb className="text-warning flex-shrink-0" style={{ width: '14px', height: '14px' }} />
            <button
              onClick={() => setInput('Show overdue tasks')}
              className="btn btn-xs btn-outline-secondary rounded-2 bg-white text-nowrap py-1 px-2 shadow-none"
              style={{ fontSize: '0.72rem' }}
            >
              Overdue Tasks
            </button>
            <button
              onClick={() => setInput('Summarize project velocity')}
              className="btn btn-xs btn-outline-secondary rounded-2 bg-white text-nowrap py-1 px-2 shadow-none"
              style={{ fontSize: '0.72rem' }}
            >
              Velocity Check
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-2 bg-white">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-3 rounded-3 small fw-medium ${
                    msg.sender === 'user'
                      ? 'bg-gradient-primary text-white shadow-sm'
                      : 'bg-light text-dark border'
                  }`}
                  style={{ maxWidth: '85%', fontSize: '0.8rem', lineHeight: '1.4' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-2 bg-light border-top d-flex align-items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI Copilot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="form-control form-control-sm bg-white border rounded-3 shadow-none text-sm"
            />
            <button
              type="submit"
              className="btn btn-sm btn-primary bg-gradient-primary border-0 rounded-3 px-3 shadow-sm d-flex align-items-center justify-center"
              style={{ height: '31px' }}
            >
              <Send style={{ width: '14px', height: '14px' }} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn bg-gradient-dark-header text-white rounded-circle p-3 shadow-lg border border-secondary border-opacity-25 d-flex align-items-center justify-center position-relative"
        style={{ width: '56px', height: '56px', transition: 'transform 0.2s' }}
        title="ProjectPulse AI Assistant"
      >
        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
          <span className="visually-hidden">Online status</span>
        </span>
        <Sparkles className="text-info" style={{ width: '24px', height: '24px' }} />
      </button>
    </div>
  );
};
