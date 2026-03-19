import { supabase } from '../lib/supabase.js';

// Simple unique ID generator (replaces uuid dependency)
function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 15);
}

// Mock conversation data
const MOCK_CONVERSATIONS = [
  {
    id: 'conv-1',
    profileId: 'profile-1',
    profileName: 'Sarah Chen',
    lastMessage: 'That sounds amazing! When are you free?',
    lastMessageTime: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
    unreadCount: 0,
  },
  {
    id: 'conv-2',
    profileId: 'profile-2',
    profileName: 'Jessica Martinez',
    lastMessage: 'Love that place! Have you been there before?',
    lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    profileId: 'profile-3',
    profileName: 'Emily Rodriguez',
    lastMessage: 'Haha, that\'s so funny 😂',
    lastMessageTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    unreadCount: 2,
  },
  {
    id: 'conv-4',
    profileId: 'profile-4',
    profileName: 'Amanda Stone',
    lastMessage: 'Thanks for the recommendation!',
    lastMessageTime: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
    unreadCount: 0,
  },
];

// Mock messages data
const MOCK_MESSAGES = {
  'conv-1': [
    {
      id: 'msg-1',
      senderId: 'user-123',
      text: 'Hey Sarah! How are you doing?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
    {
      id: 'msg-2',
      senderId: 'profile-1',
      text: 'Hi! I\'m doing great, thanks for asking!',
      timestamp: new Date(Date.now() - 3550000).toISOString(),
      read: true,
    },
    {
      id: 'msg-3',
      senderId: 'profile-1',
      text: 'I love your taste in music btw',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      read: true,
    },
    {
      id: 'msg-4',
      senderId: 'user-123',
      text: 'Thanks! I saw you have some great recommendations too',
      timestamp: new Date(Date.now() - 3450000).toISOString(),
      read: true,
    },
    {
      id: 'msg-5',
      senderId: 'profile-1',
      text: 'Would love to grab coffee sometime and chat more?',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      read: true,
    },
    {
      id: 'msg-6',
      senderId: 'user-123',
      text: 'That sounds great! Are you free this weekend?',
      timestamp: new Date(Date.now() - 3350000).toISOString(),
      read: true,
    },
    {
      id: 'msg-7',
      senderId: 'profile-1',
      text: 'That sounds amazing! When are you free?',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      read: true,
    },
  ],
  'conv-2': [
    {
      id: 'msg-8',
      senderId: 'user-123',
      text: 'Have you been to that new restaurant downtown?',
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      read: true,
    },
    {
      id: 'msg-9',
      senderId: 'profile-2',
      text: 'Not yet, is it good?',
      timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      read: true,
    },
    {
      id: 'msg-10',
      senderId: 'user-123',
      text: 'Yeah amazing! The pasta was incredible',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      read: true,
    },
    {
      id: 'msg-11',
      senderId: 'profile-2',
      text: 'Love that place! Have you been there before?',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: true,
    },
  ],
  'conv-3': [
    {
      id: 'msg-12',
      senderId: 'user-123',
      text: 'OMG that video you sent me was hilarious',
      timestamp: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      read: true,
    },
    {
      id: 'msg-13',
      senderId: 'profile-3',
      text: 'Haha, that\'s so funny 😂',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ],
  'conv-4': [
    {
      id: 'msg-14',
      senderId: 'user-123',
      text: 'You should definitely check out that hiking trail I mentioned',
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      read: true,
    },
    {
      id: 'msg-15',
      senderId: 'profile-4',
      text: 'Thanks for the recommendation!',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      read: true,
    },
  ],
};

/**
 * Get all conversations for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of conversation objects
 */
export const getConversations = async (userId) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          id,
          profile_id,
          profiles!inner(name),
          last_message,
          last_message_time,
          unread_count
        `
        )
        .eq('user_id', userId)
        .order('last_message_time', { ascending: false });

      if (error) throw error;

      return data.map((conv) => ({
        id: conv.id,
        profileId: conv.profile_id,
        profileName: conv.profiles.name,
        lastMessage: conv.last_message,
        lastMessageTime: conv.last_message_time,
        unreadCount: conv.unread_count || 0,
      }));
    } catch (error) {
      console.error('Supabase error fetching conversations:', error);
      // Fall back to mock data
      return MOCK_CONVERSATIONS;
    }
  }

  // Return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_CONVERSATIONS);
    }, 300);
  });
};

/**
 * Get all messages for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Array>} Array of message objects
 */
export const getMessages = async (conversationId) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, text, timestamp, read')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        text: msg.text,
        timestamp: msg.timestamp,
        read: msg.read || false,
      }));
    } catch (error) {
      console.error('Supabase error fetching messages:', error);
      // Fall back to mock data
      const mockMessages = MOCK_MESSAGES[conversationId] || [];
      return mockMessages;
    }
  }

  // Return mock data with simulated delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockMessages = MOCK_MESSAGES[conversationId] || [];
      resolve(mockMessages);
    }, 300);
  });
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} text - The message text
 * @param {string} senderId - The sender's user ID
 * @returns {Promise<Object>} The created message object
 */
export const sendMessage = async (conversationId, text, senderId) => {
  const newMessage = {
    id: generateId(),
    senderId,
    text,
    timestamp: new Date().toISOString(),
    read: true,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            text,
            timestamp: newMessage.timestamp,
            read: true,
          },
        ])
        .select('id, sender_id, text, timestamp, read')
        .single();

      if (error) throw error;

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: text,
          last_message_time: newMessage.timestamp,
        })
        .eq('id', conversationId);

      return {
        id: data.id,
        senderId: data.sender_id,
        text: data.text,
        timestamp: data.timestamp,
        read: data.read || true,
      };
    } catch (error) {
      console.error('Supabase error sending message:', error);
      // Return the local message for optimistic UI update
      return newMessage;
    }
  }

  // Simulate message send with mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(newMessage);
    }, 300);
  });
};

/**
 * Mark a conversation as read
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<void>}
 */
export const markConversationAsRead = async (conversationId) => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('read', false);

      if (error) throw error;

      // Update conversation unread count
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Supabase error marking conversation as read:', error);
    }
  }
};

/**
 * Search messages
 * @param {string} conversationId - The conversation ID
 * @param {string} query - The search query
 * @returns {Promise<Array>} Array of matching messages
 */
export const searchMessages = async (conversationId, query) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, text, timestamp, read')
        .eq('conversation_id', conversationId)
        .ilike('text', `%${query}%`);

      if (error) throw error;

      return data.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        text: msg.text,
        timestamp: msg.timestamp,
        read: msg.read || false,
      }));
    } catch (error) {
      console.error('Supabase error searching messages:', error);
      // Fall back to client-side search on mock data
      const messages = MOCK_MESSAGES[conversationId] || [];
      return messages.filter((msg) =>
        msg.text.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  // Client-side search on mock data
  return new Promise((resolve) => {
    const messages = MOCK_MESSAGES[conversationId] || [];
    const results = messages.filter((msg) =>
      msg.text.toLowerCase().includes(query.toLowerCase())
    );
    setTimeout(() => {
      resolve(results);
    }, 300);
  });
};

/**
 * Delete a message (soft delete)
 * @param {string} messageId - The message ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ text: '[Message deleted]', deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Supabase error deleting message:', error);
    }
  }
};
