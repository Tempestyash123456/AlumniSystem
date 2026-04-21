import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi, profileApi, getImageUrl } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Spinner, Button } from '../../components/ui';
import type { ChatMessageDto, ConversationDto, ProfileResponse } from '../../types';
import './ChatPage.css';

export const ChatPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const targetUserId = searchParams.get('to');
    const { user: currentUser } = useAuthStore();

    const [conversations, setConversations] = useState<ConversationDto[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId);
    const [selectedUser, setSelectedUser] = useState<ProfileResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch conversations list
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await chatApi.getConversations();
                if (res.success && res.data) {
                    setConversations(res.data);
                    
                    // If no user selected, and we have conversations, pick the first one
                    if (!selectedUserId && res.data.length > 0) {
                        setSelectedUserId(res.data[0].userId);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    // Handle initial 'to' param
    useEffect(() => {
        if (targetUserId) {
            setSelectedUserId(targetUserId);
            // Check if this user is in conversations, if not, we can still fetch them
            const exists = conversations.find(c => c.userId === targetUserId);
            if (!exists) {
                // We'll fetch their profile in the next useEffect
            }
        }
    }, [targetUserId, conversations]);

    // Fetch history and profile for selected user
    useEffect(() => {
        if (!selectedUserId) return;

        const fetchData = async () => {
            try {
                const [historyRes, profileRes] = await Promise.all([
                    chatApi.getHistory(selectedUserId),
                    profileApi.getProfileById(selectedUserId)
                ]);

                if (historyRes.success && historyRes.data) {
                    setMessages(historyRes.data);
                }
                if (profileRes.success && profileRes.data) {
                    setSelectedUser(profileRes.data);
                }
            } catch (err) {
                console.error('Failed to fetch chat data:', err);
            }
        };
        fetchData();

        // Polling for new messages
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [selectedUserId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !newMessage.trim() || sending) return;

        setSending(true);
        setError(null);
        try {
            const res = await chatApi.send(selectedUserId, newMessage.trim());
            if (res.success && res.data) {
                setMessages(prev => [...prev, res.data!]);
                setNewMessage('');
                
                // Refresh conversations list to make sure this user is there
                const convRes = await chatApi.getConversations();
                if (convRes.data) setConversations(convRes.data);
            } else if (res.error) {
                setError(res.error.message);
            }
        } catch (err) {
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="chat-loading">
                <Spinner size={40} />
                <p>Establishing secure connection...</p>
            </div>
        );
    }

    return (
        <div className="chat-container animate-fade-in">
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h2>Conversations</h2>
                </div>
                <div className="chat-conversations-list">
                    {conversations.length === 0 && !targetUserId ? (
                        <div className="no-conversations">
                            <p>No active chats. Connect with peers to start messaging.</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv.userId} 
                                className={`conversation-item ${selectedUserId === conv.userId ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedUserId(conv.userId);
                                    setSearchParams({ to: conv.userId });
                                }}
                            >
                                <img 
                                    src={conv.profilePhotoUrl || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'} 
                                    alt={conv.userName} 
                                    className="conv-avatar"
                                />
                                <div className="conv-info">
                                    <span className="conv-name">{conv.userName}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="chat-main">
                {selectedUserId ? (
                    <>
                        <div className="chat-main-header">
                            {selectedUser ? (
                                <div className="header-user-info">
                                    <img 
                                        src={selectedUser.profilePhotoUrl || 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/avatars/01.png'} 
                                        alt={selectedUser.firstName} 
                                        className="header-avatar"
                                    />
                                    <div>
                                        <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                                        <span className="user-status">Online</span>
                                    </div>
                                </div>
                            ) : (
                                <h3>Loading user...</h3>
                            )}
                        </div>

                        <div className="chat-messages-area">
                            {messages.length === 0 ? (
                                <div className="empty-chat">
                                    <p>No messages yet. Say hello!</p>
                                    <p className="limit-hint">You can send max 3 messages for each user.</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.senderId === currentUser?.id;
                                    return (
                                        <div key={msg.id || i} className={`message-bubble-wrapper ${isMe ? 'me' : 'them'}`}>
                                            <div className="message-bubble">
                                                <p className="message-content">{msg.content}</p>
                                                <span className="message-time">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-area">
                            {error && <div className="chat-error-msg">{error}</div>}
                            <form onSubmit={handleSendMessage} className="chat-form">
                                <input 
                                    type="text" 
                                    placeholder="Type a message (max 100 characters)..."
                                    maxLength={100}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={sending}
                                />
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={!newMessage.trim() || sending}
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </Button>
                            </form>
                            <div className="char-count">
                                {newMessage.length}/100
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-icon">💬</div>
                        <h3>Select a conversation</h3>
                        <p>Choose a peer from the list or find new connections in the directory.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
