import { useState, useEffect, useRef } from "react";
import PortalLayout from "../components/PortalLayout";
import "./StudentAcademicHub.css";

const INITIAL_MESSAGES = [
  { id: 1, sender: "Saumya Perera", text: "Has anyone started the DBMS assignment?", isMe: false },
  { id: 2, sender: "Imesh Harshana", text: "Just finished the ER diagram part.", isMe: false },
  { id: 3, sender: "Nethmi Silva", text: "I'm stuck on the normalization task. Any tips?", isMe: false },
];

function StudentGroupChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: "You",
      text: inputText,
      isMe: true
    };
    
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <PortalLayout 
      title="Group Chat" 
      subtitle="Real-time collaboration for academic groups and study circles."
    >
      <div className="academic-hub-stack">
        <div className="chat-container">
          <header className="chat-header">
            <div>
              <h3 style={{ margin: 0 }}>Academic Group Chat</h3>
              <p className="helper-text" style={{ margin: 0 }}>IT Year 3 - Section A</p>
            </div>
            <div className="session-tag" style={{ background: '#dcfce7', color: '#166534' }}>12 Active</div>
          </header>

          <main className="chat-messages" ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={`chat-bubble ${m.isMe ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                {!m.isMe && <strong style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px', opacity: 0.8 }}>{m.sender}</strong>}
                <div>{m.text}</div>
                <div style={{ fontSize: '0.65rem', textAlign: 'right', marginTop: '4px', opacity: 0.6 }}>Just now</div>
              </div>
            ))}
          </main>

          <form className="chat-input-area" onSubmit={onSendMessage}>
            <input 
              className="chat-input" 
              placeholder="Type a message..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
            <button type="submit" className="solid-btn">Send</button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}

export default StudentGroupChat;
