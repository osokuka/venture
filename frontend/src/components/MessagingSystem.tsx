import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Send, 
  MessageSquare, 
  Search,
  X,
  ArrowLeft
} from "lucide-react";
import { 
  mockMessages, 
  getMessagesBetweenUsers, 
  getUnreadMessagesForUser,
  mockUsers,
  type User,
  type Message 
} from './MockData';
import { validateMessage, sanitizeForDisplay, sanitizeInput } from '../utils/security';
import { SafeText } from './SafeText';

interface MessagingSystemProps {
  currentUser: User;
  selectedUserId?: string;
  onClose?: () => void;
}

export function MessagingSystem({ currentUser, selectedUserId, onClose }: MessagingSystemProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(selectedUserId || null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get all users that the current user has conversations with
  const getConversations = () => {
    const conversationUserIds = new Set<string>();
    
    mockMessages.forEach(msg => {
      if (msg.senderId === currentUser.id) {
        conversationUserIds.add(msg.receiverId);
      } else if (msg.receiverId === currentUser.id) {
        conversationUserIds.add(msg.senderId);
      }
    });

    return Array.from(conversationUserIds)
      .map(userId => mockUsers.find(u => u.id === userId))
      .filter((user): user is User => user !== undefined);
  };

  const conversations = getConversations();
  const unreadMessages = getUnreadMessagesForUser(currentUser.id);

  const getLastMessageWithUser = (userId: string) => {
    const messages = getMessagesBetweenUsers(currentUser.id, userId);
    return messages[messages.length - 1];
  };

  const getUnreadCountForUser = (userId: string) => {
    return unreadMessages.filter(msg => msg.senderId === userId).length;
  };

  const selectedUser = selectedConversation 
    ? mockUsers.find(u => u.id === selectedConversation)
    : null;

  const conversationMessages = selectedConversation 
    ? getMessagesBetweenUsers(currentUser.id, selectedConversation)
    : [];

  const handleSendMessage = () => {
    // Security: Validate and sanitize message
    const sanitizedMessage = validateMessage(newMessage, 10000);
    if (!sanitizedMessage || !selectedConversation) return;

    // In a real app, this would send to backend
    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: selectedConversation,
      content: sanitizedMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add to mock messages (in real app, this would be handled by backend)
    mockMessages.push(message);
    setNewMessage('');
  };

  const getUserDisplayName = (user: User) => {
    switch (user.role) {
      case 'venture':
        return user.profile.companyName;
      case 'investor':
        return user.profile.organizationName || user.profile.name;
      case 'mentor':
        return user.profile.name;
      default:
        return 'Unknown';
    }
  };

  const getUserAvatar = (user: User) => {
    if (user.role === 'venture') {
      return user.profile.logo || undefined;
    }
    return user.profile.avatar || undefined;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(user =>
    getUserDisplayName(user).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[600px] flex border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-muted/20">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg">Messages</h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(sanitizeInput(e.target.value, 100))}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(600px-120px)]">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map(user => {
                const lastMessage = getLastMessageWithUser(user.id);
                const unreadCount = getUnreadCountForUser(user.id);
                
                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation === user.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(user.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getUserAvatar(user)} />
                        <AvatarFallback>{getUserDisplayName(user)[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm truncate">{getUserDisplayName(user)}</h4>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            <SafeText text={lastMessage?.content || 'No messages yet'} />
                          </p>
                          {unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 min-w-[20px] h-5">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Conversation View */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar>
                  <AvatarImage src={getUserAvatar(selectedUser)} />
                  <AvatarFallback>{getUserDisplayName(selectedUser)[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4>{getUserDisplayName(selectedUser)}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedUser.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                    <p>Start a conversation with {getUserDisplayName(selectedUser)}</p>
                  </div>
                ) : (
                  conversationMessages.map(message => {
                    const isCurrentUser = message.senderId === currentUser.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <SafeText text={message.content} as="p" className="text-sm" />
                          <p
                            className={`text-xs mt-1 ${
                              isCurrentUser
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder={`Message ${getUserDisplayName(selectedUser)}...`}
                  value={newMessage}
                  onChange={(e) => {
                    // Security: Sanitize input as user types (max 10000 chars)
                    const sanitized = sanitizeInput(e.target.value, 10000);
                    setNewMessage(sanitized);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}