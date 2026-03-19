import React, { useState } from 'react';
import { ArrowLeft, Send, Clock, CheckCheck, MessageCircle } from 'lucide-react';
import { getConversations, getMessages, sendMessage } from '../services/chatService';

const ChatScreen = ({ profiles = [], positions = [] }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter profiles where user went LONG (invested)
  const investedProfiles = positions
    .filter((pos) => pos.direction === 'LONG')
    .map((pos) => pos.profileId);

  const filteredProfiles = profiles.filter((p) =>
    investedProfiles.includes(p.id)
  );

  // Load conversations on mount
  React.useEffect(() => {
    const loadConversations = async () => {
      try {
        // In a real app, fetch actual user ID from auth context
        const convs = await getConversations('user-123');
        // Filter conversations to only show those for profiles user invested in
        const filtered = convs.filter((c) =>
          filteredProfiles.some((p) => p.id === c.profileId)
        );
        setConversations(filtered);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [filteredProfiles]);

  // Load messages when conversation is selected
  React.useEffect(() => {
    if (selectedConversation) {
      const loadMessages = async () => {
        try {
          const msgs = await getMessages(selectedConversation.id);
          setMessages(msgs);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedConversation]);

  // Find profile data for compatibility score
  const getProfileData = (profileId) => {
    return filteredProfiles.find((p) => p.id === profileId);
  };

  // Get gradient color based on first letter hash
  const getGradientColor = (name) => {
    const colors = [
      'from-pink-500 to-orange-400',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-400',
      'from-teal-500 to-blue-500',
      'from-green-500 to-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Format relative timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const msgTime = new Date(timestamp);
    const diffMs = now - msgTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return msgTime.toLocaleDateString();
  };

  // Format time for message timestamps within chat
  const formatChatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const newMessage = await sendMessage(
        selectedConversation.id,
        messageText,
        'user-123'
      );

      // Add message to local state optimistically
      setMessages([...messages, newMessage]);
      setMessageText('');

      // Update conversation last message
      setConversations(
        conversations.map((c) =>
          c.id === selectedConversation.id
            ? {
                ...c,
                lastMessage: messageText,
                lastMessageTime: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Get first letter of name for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Conversations List View
  if (!selectedConversation) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: '#0a0a12' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
              <span
                className="text-xs font-bold text-white px-2 py-1 rounded-full"
                style={{ backgroundColor: '#e8475f' }}
              >
                {conversations.filter((c) => c.unreadCount > 0).length}
              </span>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <MessageCircle size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-base">
                No matches yet. Start trading to unlock conversations!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className="w-full px-6 py-4 hover:bg-gray-900 transition-colors text-left flex items-start gap-3"
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br ${getGradientColor(
                      conversation.profileName
                    )}`}
                  >
                    {getInitial(conversation.profileName)}
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-semibold truncate">
                        {conversation.profileName}
                      </h3>
                      <span className="text-gray-500 text-xs ml-2 flex-shrink-0">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {conversation.unreadCount > 0 && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#e8475f' }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chat Detail View
  const profileData = getProfileData(selectedConversation.profileId);
  const compatibilityScore = profileData?.compatibilityScore || 0;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#0a0a12' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedConversation(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br ${getGradientColor(
              selectedConversation.profileName
            )}`}
          >
            {getInitial(selectedConversation.profileName)}
          </div>
          <div>
            <h2 className="text-white font-semibold">
              {selectedConversation.profileName}
            </h2>
            {compatibilityScore > 0 && (
              <p className="text-xs text-gray-400">
                {compatibilityScore}% compatible
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Matched Badge */}
      <div className="px-6 py-3 flex justify-center">
        <div
          className="text-xs font-semibold text-white px-3 py-1 rounded-full flex items-center gap-2"
          style={{ backgroundColor: 'rgba(15,15,23,0.5)', borderColor: '#3ecfcf', borderWidth: '1px' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3ecfcf' }} />
          Matched via Evolve
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, idx) => {
            const isOwn = message.senderId === 'user-123';
            const showTimestamp =
              idx === 0 ||
              new Date(messages[idx - 1].timestamp).getTime() -
                new Date(message.timestamp).getTime() >
                300000; // 5 min gap

            return (
              <div key={message.id}>
                {showTimestamp && (
                  <div className="flex items-center justify-center my-4">
                    <Clock size={12} className="text-gray-600 mr-2" />
                    <span className="text-xs text-gray-600">
                      {formatChatTime(message.timestamp)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'text-white'
                        : 'text-gray-100'
                    }`}
                    style={{
                      backgroundColor: isOwn ? '#e8475f' : 'rgba(15,15,23,0.5)',
                    }}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {formatChatTime(message.timestamp)}
                      </span>
                      {isOwn && message.read && (
                        <CheckCheck size={14} className="opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
            style={{ backgroundColor: 'rgba(15,15,23,0.8)' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: messageText.trim() ? '#e8475f' : '#666',
              color: 'white',
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
