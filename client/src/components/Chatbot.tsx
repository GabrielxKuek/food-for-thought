import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { MessageCircle, Send, X } from 'lucide-react';
import './Chatbot.css';

const CONSTANT_VARIABLE = process.env.REACT_APP_GEMINI_KEY;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  userProfile: UserProfile | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ userProfile }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    const systemPrompt = `You are a helpful fitness and nutrition coach assistant. The user has the following profile:

Profile:
- Age: ${userProfile?.profile.age || 25}
- Sex: ${userProfile?.profile.sex || 'male'}
- Height: ${userProfile?.profile.height_cm || 175} cm
- Current Weight: ${userProfile?.profile.initial_weight_kg || 70} kg
- Goal: ${userProfile?.goal.type?.replace('_', ' ') || 'maintenance'}
- Weekly Target: ${userProfile?.goal.weekly_target_kg || 0} kg/week

Give concise, actionable advice. Keep responses under 3 sentences unless more detail is specifically asked for. Focus on practical tips they can implement immediately. in your responses, fitness advice (eg workout routines) and nutritional advice arent limited to 3 sentences.`;

    try {
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I will act as a helpful fitness and nutrition coach based on this user profile.' }] },
        ...chatMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONSTANT_VARIABLE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: 200,
              temperature: 0.7
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
        setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      } else {
        throw new Error();
      }
    } catch {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Try asking about meal timing, protein sources, or workout suggestions!" 
      }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Chat FAB */}
      <button className="chat-fab" onClick={() => setIsChatOpen(true)}>
        <MessageCircle size={24} />
      </button>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="chat-overlay">
          <div className="chat-modal">
            <div className="chat-header">
              <h3>Fitness Coach</h3>
              <button className="chat-close" onClick={() => setIsChatOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div className="chat-welcome">
                  <p>Hi! Ask me anything about reaching your fitness goals faster.</p>
                  <div className="chat-suggestions">
                    <button onClick={() => setChatInput("How can I eat more protein?")}>
                      How can I eat more protein?
                    </button>
                    <button onClick={() => setChatInput("What should I eat before a workout?")}>
                      Pre-workout meal ideas?
                    </button>
                    <button onClick={() => setChatInput("How do I lose weight faster?")}>
                      Tips to lose weight faster?
                    </button>
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  <p>{msg.content}</p>
                </div>
              ))}
              {isSending && (
                <div className="chat-message assistant">
                  <p className="typing">Thinking...</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="chat-send" onClick={sendMessage} disabled={isSending || !chatInput.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;