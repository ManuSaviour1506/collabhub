import { useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
// Import the Payment Modal
import PayModal from '../components/wallet/PayModal';

// IMPORTANT: Must match your Server Port (5001)
const ENDPOINT = "http://localhost:5001"; 
var socket;

const Chat = () => {
  const { user } = useContext(AuthContext);
  
  const [chats, setChats] = useState([]);           
  const [selectedChat, setSelectedChat] = useState(null); 
  const [messages, setMessages] = useState([]);     
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);

  // NEW: State to control the Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);

  // Ref to auto-scroll to bottom of chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Initialize Socket Connection
  useEffect(() => {
    if(!user) return;

    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    
    // Listen for incoming messages in real-time
    socket.on("message received", (newMessageReceived) => {
       if (selectedChat && selectedChat._id === newMessageReceived.chat._id) {
         setMessages((prev) => [...prev, newMessageReceived]);
       } else {
         fetchChats(); 
       }
    });

    return () => { 
      socket.disconnect(); 
    };
  }, [user, selectedChat]);

  // 2. Fetch My Chats (Sidebar List)
  const fetchChats = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.get('/chat', { headers: { Authorization: `Bearer ${token}` }});
      setChats(data);
      setLoadingChats(false);
    } catch (err) { 
      console.error(err); 
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (user) fetchChats();
  }, [user]);

  // 3. Fetch Messages when a chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.get(`/message/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(data);
        
        socket.emit("join chat", selectedChat._id);
        scrollToBottom();
      } catch (error) { 
        console.error(error); 
      }
    };
    fetchMessages();
  }, [selectedChat]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4. Send Message Handler
  const sendMessage = async (e) => {
    if ((e.type === 'keydown' && e.key !== "Enter") || !newMessage) return;

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const content = newMessage;
      setNewMessage(""); 
      
      const { data } = await api.post('/message', 
        { content: content, chatId: selectedChat._id },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      socket.emit("new message", data);
      setMessages([...messages, data]);
      fetchChats();
    } catch (error) { 
      console.error(error); 
    }
  };

  // Helper: Get the name AND ID of the OTHER user
  const getSenderInfo = (chatUsers) => {
    if (!chatUsers || chatUsers.length < 2) return { name: "Unknown", id: null };
    const sender = chatUsers[0]._id === user._id ? chatUsers[1] : chatUsers[0];
    // IMPORTANT: We need _id for the payment system
    return { name: sender.fullName, username: sender.username, _id: sender._id };
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 p-4 gap-4">
      
      {/* --- Sidebar (Chat List) --- */}
      <div className={`w-full md:w-1/3 bg-white rounded-lg shadow-md flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No chats yet. <br/> Go to Recommendations to find a peer!
            </div>
          ) : (
            chats.map((chat) => {
              const sender = !chat.isGroupChat ? getSenderInfo(chat.users) : { name: chat.chatName };
              return (
                <div 
                  key={chat._id} 
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b cursor-pointer transition hover:bg-gray-50 
                    ${selectedChat?._id === chat._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                >
                  <p className="font-semibold text-gray-800">{sender.name}</p>
                  {chat.latestMessage && (
                     <p className="text-sm text-gray-500 truncate mt-1">
                       <span className="font-medium text-gray-700">
                         {chat.latestMessage.sender._id === user._id ? "You: " : ""}
                       </span>
                       {chat.latestMessage.content}
                     </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- Main Chat Window --- */}
      <div className={`w-full md:w-2/3 bg-white rounded-lg shadow-md flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedChat(null)}
                >
                  ← Back
                </button>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {!selectedChat.isGroupChat ? getSenderInfo(selectedChat.users).name : selectedChat.chatName}
                  </h3>
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    {socketConnected ? "● Online" : "○ Reconnecting..."}
                  </span>
                </div>
              </div>

              {/* --- NEW: Pay Button (Only for 1-on-1 chats) --- */}
              {!selectedChat.isGroupChat && (
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow text-sm font-bold flex items-center gap-2 transition"
                >
                  <span>💰</span> Pay / Tip
                </button>
              )}
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
              {messages.map((m, i) => {
                const isMe = m.sender._id === user._id;
                return (
                  <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm
                        ${isMe 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={sendMessage}
                />
                <button 
                  onClick={sendMessage}
                  className="bg-indigo-600 text-white rounded-full p-2 px-4 hover:bg-indigo-700 transition"
                >
                  Send
                </button>
              </div>
            </div>

            {/* --- NEW: Pay Modal Render --- */}
            {showPayModal && !selectedChat.isGroupChat && (
              <PayModal 
                receiverId={getSenderInfo(selectedChat.users)._id}
                receiverName={getSenderInfo(selectedChat.users).name}
                onClose={() => setShowPayModal(false)}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;