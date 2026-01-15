import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { 
  Send, 
  MessageSquare, 
  Search,
  X,
  ArrowLeft,
  Loader2,
  Edit2,
  Check,
  X as XIcon,
  MoreVertical,
  Trash2
} from "lucide-react";
import { toast } from 'sonner@2.0.3';
import { type FrontendUser } from '../types';
import { messagingService, type Conversation, type Message } from '../services/messagingService';
import { validateMessage, sanitizeInput, sanitizeForDisplay } from '../utils/security';
import { mentorService } from '../services/mentorService';
import { investorService } from '../services/investorService';

interface MessagingSystemProps {
  currentUser: FrontendUser;
  selectedUserId?: string;
  selectedUserName?: string; // Optional: Name of the user to contact (for new conversations)
  selectedUserRole?: string; // Optional: Role of the user to contact
  onClose?: () => void;
  onRefreshUnreadCount?: () => void; // Callback to refresh global unread count badge
}

export function MessagingSystem({ currentUser, selectedUserId, selectedUserName, selectedUserRole, onClose, onRefreshUnreadCount }: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
  
  // Ref to track the last fetched conversation ID to prevent duplicate fetches
  const lastFetchedConversationId = useRef<string | null>(null);

  // Fetch conversations on mount (only if user is valid)
  useEffect(() => {
    if (currentUser?.id) {
      fetchConversations();
      // Refresh global unread count when component mounts to ensure badge is accurate
      if (onRefreshUnreadCount) {
        onRefreshUnreadCount();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Fetch messages when conversation is selected (skip if it's a new conversation)
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== 'new' && !isLoadingMessages) {
      // Reset the fetch tracking when conversation changes
      if (lastFetchedConversationId.current !== selectedConversation.id) {
        lastFetchedConversationId.current = null;
        fetchMessages(selectedConversation.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]); // Only depend on the ID, not the whole object

  // Auto-scroll to bottom when messages change (with debounce to prevent excessive scrolling)
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMessages) {
      const timeoutId = setTimeout(() => {
        const scrollArea = document.getElementById('messages-scroll-area');
        if (scrollArea) {
          const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 150);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, isLoadingMessages]); // Only depend on length and loading state

  // Fetch user details for a new conversation (when user clicks Contact but conversation doesn't exist)
  const fetchUserDetailsForNewConversation = async (userId: string) => {
    try {
      // Try to fetch mentor by searching through public mentors
      // We'll search with a small limit to find the user quickly
      try {
        const mentorsResponse = await mentorService.getPublicMentors({ page: 1 });
        const mentors = Array.isArray(mentorsResponse) ? mentorsResponse : mentorsResponse.results || [];
        const mentor = mentors.find((m: any) => m.user === userId);
        
        if (mentor) {
          const tempConv: Conversation = {
            id: 'new',
            participants: [],
            other_participant: {
              id: userId,
              email: mentor.contact_email || mentor.user_email || '',
              full_name: mentor.full_name || 'Mentor',
              role: 'MENTOR',
            },
            created_at: new Date().toISOString(),
            unread_count: 0,
          };
          setSelectedConversation(tempConv);
          return;
        }
      } catch (e) {
        console.log('Not found in mentors, trying investors...');
      }
      
      // Try to fetch investor
      try {
        const investorsResponse = await investorService.getPublicInvestors();
        const investors = Array.isArray(investorsResponse) 
          ? investorsResponse 
          : investorsResponse.results || investorsResponse.data || [];
        const investor = investors.find((i: any) => i.user === userId || i.id === userId);
        
        if (investor) {
          const tempConv: Conversation = {
            id: 'new',
            participants: [],
            other_participant: {
              id: userId,
              email: investor.contact_email || investor.email || '',
              full_name: investor.name || investor.full_name || 'Investor',
              role: 'INVESTOR',
            },
            created_at: new Date().toISOString(),
            unread_count: 0,
          };
          setSelectedConversation(tempConv);
          return;
        }
      } catch (e) {
        console.log('Not found in investors');
      }
      
      // Fallback: Create temporary conversation with minimal info
      const tempConv: Conversation = {
        id: 'new',
        participants: [],
        other_participant: {
          id: userId,
          email: '',
          full_name: 'User',
          role: '',
        },
        created_at: new Date().toISOString(),
        unread_count: 0,
      };
      setSelectedConversation(tempConv);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // Fallback: Create temporary conversation with minimal info
      const tempConv: Conversation = {
        id: 'new',
        participants: [],
        other_participant: {
          id: userId,
          email: '',
          full_name: 'User',
          role: '',
        },
        created_at: new Date().toISOString(),
        unread_count: 0,
      };
      setSelectedConversation(tempConv);
    }
  };

  const fetchConversations = async () => {
    if (!currentUser?.id) {
      return; // Don't fetch if user is invalid
    }
    
    setIsLoading(true);
    try {
      const data = await messagingService.getConversations();
      // Ensure data is an array
      const conversationsList = Array.isArray(data) ? data : [];
      setConversations(conversationsList);
      
      // If selectedUserId is provided, find and select that conversation
      // If conversation doesn't exist yet, create a temporary one for UI purposes
      if (selectedUserId) {
        const conv = conversationsList.find(c => c.other_participant?.id === selectedUserId);
        if (conv) {
          setSelectedConversation(conv);
        } else {
          // Create temporary conversation with provided name or fetch user details
          if (selectedUserName) {
            // Use provided name if available (from VentureDashboard)
            const tempConv: Conversation = {
              id: 'new',
              participants: [],
              other_participant: {
                id: selectedUserId,
                email: '',
                full_name: selectedUserName,
                role: selectedUserRole || '',
              },
              created_at: new Date().toISOString(),
              unread_count: 0,
            };
            setSelectedConversation(tempConv);
          } else {
            // Fetch user details to populate the temporary conversation
            // This allows users to see the correct name while typing
            fetchUserDetailsForNewConversation(selectedUserId);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      const errorMessage = error?.response?.status === 403
        ? 'You need to be approved to view messages. Please wait for admin approval.'
        : 'Failed to load conversations';
      toast.error(errorMessage);
      setConversations([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!conversationId || !currentUser?.id) {
      return; // Don't fetch if conversation ID or user is invalid
    }
    
    // Prevent duplicate fetches - check if we're already loading or if this conversation was just fetched
    if (isLoadingMessages || lastFetchedConversationId.current === conversationId) {
      return;
    }
    
    // Mark this conversation as being fetched
    lastFetchedConversationId.current = conversationId;
    setIsLoadingMessages(true);
    
    try {
      // Find the selected conversation to get all conversation IDs for this user
      const selectedConv = conversations.find(c => c.id === conversationId);
      const allConversationIds = (selectedConv as any)?._allConversationIds || [conversationId];
      
      // Fetch messages from all conversations with this user
      const allMessagesPromises = allConversationIds.map((id: string) => 
        messagingService.getConversation(id).then(conv => conv.messages || [])
      );
      
      const allMessagesArrays = await Promise.all(allMessagesPromises);
      
      // Flatten and merge all messages, then sort chronologically
      const allMessages = allMessagesArrays.flat();
      const uniqueMessages = Array.from(
        new Map(allMessages.map(msg => [msg.id, msg])).values()
      );
      
      // Sort by created_at (oldest first) for chronological display
      uniqueMessages.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return timeA - timeB;
      });
      
      setMessages(uniqueMessages);
      
      // Update selectedConversation with the primary conversation data
      if (selectedConv) {
        const primaryConversation = await messagingService.getConversation(conversationId);
        if (primaryConversation && selectedConversation?.id === conversationId) {
          // Update only if there are meaningful changes (like unread_count)
          if (selectedConversation.unread_count !== primaryConversation.unread_count) {
            setSelectedConversation(primaryConversation);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
      setMessages([]); // Set empty array on error
      // Reset the ref on error so we can retry
      lastFetchedConversationId.current = null;
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Mark conversation as read when selected and messages are loaded
  // Only mark as read if conversation has unread messages and is not a new conversation
  useEffect(() => {
    if (
      selectedConversation?.id && 
      selectedConversation.id !== 'new' &&
      selectedConversation.unread_count > 0 && 
      currentUser?.id && 
      !isLoadingMessages &&
      messages.length > 0 // Only mark as read after messages are loaded
    ) {
      // Mark as read after a short delay to ensure messages are fully loaded
      const timeoutId = setTimeout(() => {
        messagingService.markConversationRead(selectedConversation.id)
          .then(() => {
            // Refresh conversations to update unread count
            fetchConversations();
            // Refresh global unread count badge in ModernDashboardLayout
            if (onRefreshUnreadCount) {
              onRefreshUnreadCount();
            }
          })
          .catch(console.error);
      }, 1000); // Increased delay to ensure messages are loaded
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, messages.length, isLoadingMessages, onRefreshUnreadCount]); // Depend on messages.length to ensure messages are loaded

  const handleSendMessage = async () => {
    // Security: Validate and sanitize message
    if (!newMessage || !selectedConversation || !currentUser?.id) return;
    
    // Security: Trim only leading/trailing whitespace, preserve spaces in the middle
    let sanitizedMessage = newMessage.trim();
    
    if (!sanitizedMessage || sanitizedMessage.length === 0) {
      toast.error('Message cannot be empty.');
      return;
    }
    
    // Security: Limit length
    if (sanitizedMessage.length > 10000) {
      sanitizedMessage = sanitizedMessage.substring(0, 10000);
    }
    
    // Security: Remove dangerous patterns but preserve spaces
    sanitizedMessage = sanitizedMessage
      .replace(/[a-zA-Z]:[\\\/]/g, '') // Remove drive letters
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/data:/gi, '') // Remove data URIs
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    
    if (!sanitizedMessage || sanitizedMessage.length === 0) {
      toast.error('Message cannot be empty after sanitization.');
      return;
    }

    try {
      // If this is a new conversation (id === 'new'), pass participant_id to create it lazily
      const participantId = selectedConversation.id === 'new' 
        ? selectedConversation.other_participant?.id 
        : undefined;
      
      const message = await messagingService.sendMessage(
        selectedConversation.id, 
        sanitizedMessage,
        participantId
      );
      
      if (message) {
        // If this was a new conversation, use the conversation_id from response or refresh
        if (selectedConversation.id === 'new') {
          const newConversationId = (message as any).conversation_id;
          if (newConversationId) {
            // Use the conversation ID from the response
            const convDetail = await messagingService.getConversation(newConversationId);
            setSelectedConversation({
              ...convDetail,
              id: newConversationId,
            });
            setMessages(convDetail.messages || []);
            // Clear selectedUserId since conversation is now created
            // This prevents re-creating temp conversation on re-render
          } else {
            // Fallback: refresh conversations and find the new one
            await fetchConversations();
            const updatedConversations = await messagingService.getConversations();
            const newConv = updatedConversations.find(
              c => c.other_participant?.id === participantId
            );
            if (newConv) {
              setSelectedConversation(newConv);
              const convDetail = await messagingService.getConversation(newConv.id);
              setMessages(convDetail.messages || []);
            }
          }
        } else {
          // Add new message to the list (will be sorted chronologically on render)
          setMessages(prev => [...prev, message]);
        }
        
        setNewMessage('');
        // Refresh conversations to update last message (but don't reset fetch tracking)
        fetchConversations();
        
        // Auto-scroll to bottom after sending
        setTimeout(() => {
          const scrollArea = document.getElementById('messages-scroll-area');
          if (scrollArea) {
            const scrollContainer = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
          }
        }, 100);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleStartEdit = (message: Message) => {
    // Check if message is editable (within 15 minutes)
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    if (minutesSinceCreation > 15) {
      toast.error('Messages can only be edited within 15 minutes of sending.');
      return;
    }
    
    setEditingMessageId(message.id);
    setEditMessageText(message.body);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editMessageText.trim()) {
      toast.error('Message cannot be empty.');
      return;
    }

    // Security: Sanitize edited message
    let sanitized = editMessageText.trim();
    
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000);
    }
    
    sanitized = sanitized
      .replace(/[a-zA-Z]:[\\\/]/g, '')
      .replace(/\.\./g, '')
      .replace(/data:/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    if (!sanitized || sanitized.length === 0) {
      toast.error('Message cannot be empty after sanitization.');
      return;
    }

    setIsUpdatingMessage(true);
    try {
      const updatedMessage = await messagingService.updateMessage(editingMessageId, sanitized);
      
      // Update the message in the messages list
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessageId ? updatedMessage : msg
      ));
      
      // Refresh conversations to update last message
      fetchConversations();
      
      setEditingMessageId(null);
      setEditMessageText('');
      toast.success('Message updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update message');
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  const isMessageEditable = (message: Message): boolean => {
    // Check if message belongs to current user
    if (String(message.sender) !== String(currentUser.id)) {
      return false;
    }
    
    // Check if message is within 15 minutes
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    return minutesSinceCreation <= 15;
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    // Prevent the click from selecting the conversation
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation? It will be removed from your inbox.')) {
      return;
    }

    try {
      await messagingService.deleteConversation(conversationId);
      
      // Remove conversation from the list
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If the deleted conversation was selected, clear the selection
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      toast.success('Conversation deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete conversation');
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Security: Helper function to safely decode HTML entities and render message text
  // This decodes HTML entities (like &#x27; for apostrophe) while still preventing XSS
  const safeMessageText = (text: string): string => {
    if (!text) return '';
    
    // Decode HTML entities safely using browser's built-in decoder
    // We use a temporary textarea element to decode entities without executing scripts
    // This handles both single-encoded (&#x27;) and double-encoded (&amp;#x27;) entities
    const textarea = document.createElement('textarea');
    
    // First pass: decode double-encoded entities (e.g., &amp;#x27; -> &#x27;)
    let decoded = text.replace(/&amp;/g, '&');
    
    // Second pass: decode all HTML entities using browser's decoder
    textarea.innerHTML = decoded;
    decoded = textarea.value;
    
    // Security: Escape HTML tags to prevent XSS while preserving decoded special characters
    // We only escape < and > to prevent script injection, but keep apostrophes, slashes, etc.
    decoded = decoded
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return decoded;
  };

  // Group conversations by the same user (aggregate duplicates)
  // Store all conversations per user to find the most recent one
  const conversationsByUser = conversations.reduce((acc, conv) => {
    const otherParticipant = conv.other_participant;
    if (!otherParticipant || !otherParticipant.id) return acc;
    
    const userId = otherParticipant.id;
    
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(conv);
    
    return acc;
  }, {} as Record<string, Conversation[]>);
  
  // For each user, pick the conversation with the most recent message
  // and combine unread counts from all conversations with that user
  const uniqueConversations = Object.entries(conversationsByUser).map(([userId, convs]) => {
    // Sort by last_message_at (most recent first)
    const sorted = [...convs].sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });
    
    // Use the most recent conversation as the primary one
    const primary = sorted[0];
    
    // Combine unread counts from all conversations with this user
    const totalUnread = convs.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    
    // Store all conversation IDs for this user (for message fetching)
    return {
      ...primary,
      unread_count: totalUnread,
      _allConversationIds: convs.map(c => c.id), // Store all IDs for this user
    };
  });
  
  // Filter by search term
  const filteredConversations = uniqueConversations.filter(conv => {
    const otherParticipant = conv.other_participant;
    if (!otherParticipant) return false;
    const name = otherParticipant.full_name || otherParticipant.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Early return if currentUser is not provided or missing id (AFTER all hooks)
  if (!currentUser || !currentUser.id) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4" />
          <p>Unable to load messaging system. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex border rounded-lg overflow-hidden bg-white">
      {/* Conversations List (Inbox) */}
      <div className="w-1/3 border-r bg-white">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inbox</h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(sanitizeInput(e.target.value, 100))}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(600px-120px)]">
          <div className="p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 && conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-12 px-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">No conversations yet</p>
                <p className="text-xs mt-1 text-gray-500">Start a conversation to see messages here.</p>
                {searchTerm && (
                  <p className="text-xs mt-2 text-gray-400">
                    Try clearing your search to see all conversations.
                  </p>
                )}
              </div>
            ) : filteredConversations.length === 0 && conversations.length > 0 ? (
              <div className="text-center text-gray-500 py-12 px-4">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">No conversations match your search</p>
                <p className="text-xs mt-1 text-gray-500">Try adjusting your search term.</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const otherParticipant = conv.other_participant;
                if (!otherParticipant) return null;
                
                return (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all relative group ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-blue-50 border-l-2 border-blue-600' 
                        : 'hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                    onClick={() => {
                      // Only set if it's a different conversation to prevent unnecessary re-renders
                      if (!selectedConversation || selectedConversation.id !== conv.id) {
                        // Reset the fetch tracking when switching conversations
                        lastFetchedConversationId.current = null;
                        // Clear messages when switching conversations
                        setMessages([]);
                        // Set the new conversation
                        setSelectedConversation(conv);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {((otherParticipant.full_name || otherParticipant.email || 'U')[0] || 'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {otherParticipant.full_name || otherParticipant.email}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {conv.last_message && (
                              <span className="text-xs text-gray-500">
                                {formatTime(conv.last_message.created_at)}
                              </span>
                            )}
                            {/* 3-dot menu - only show on hover */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete conversation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-600 truncate flex-1">
                            {conv.last_message?.body 
                              ? (conv.last_message.body.length > 50 
                                  ? safeMessageText(conv.last_message.body.substring(0, 50)) + '...' 
                                  : safeMessageText(conv.last_message.body))
                              : 'No messages yet'}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 min-w-[20px] h-5 flex-shrink-0 font-semibold">
                              {conv.unread_count}
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
        {selectedConversation && selectedConversation.other_participant ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-white shadow-sm">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {((selectedConversation.other_participant.full_name || selectedConversation.other_participant.email || 'U')[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {selectedConversation.other_participant.full_name || selectedConversation.other_participant.email}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {selectedConversation.other_participant.role.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" id="messages-scroll-area">
              <div className="p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                        <p>Start a conversation with {selectedConversation.other_participant.full_name || selectedConversation.other_participant.email}</p>
                      </div>
                    ) : (
                      // Messages are sorted chronologically from backend (oldest first)
                      // Display them in order for proper chat bubble flow
                      messages.map((message, index) => {
                        // Safety check: ensure currentUser.id exists and compare sender (which should be UUID string)
                        // Convert both to strings for comparison to handle UUID vs string mismatches
                        const isCurrentUser = currentUser?.id && String(message.sender) === String(currentUser.id);
                        
                        // Check if this is the last message to auto-scroll
                        const isLastMessage = index === messages.length - 1;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            ref={isLastMessage ? (el) => {
                              // Auto-scroll to bottom when last message renders
                              if (el) {
                                setTimeout(() => {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                }, 100);
                              }
                            } : undefined}
                          >
                            {/* Avatar for received messages (left side) */}
                            {!isCurrentUser && (
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                                  {((selectedConversation.other_participant.full_name || selectedConversation.other_participant.email || 'U')[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            {/* Message Bubble */}
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative group ${
                                isCurrentUser
                                  ? 'bg-gray-300 rounded-br-sm' // Silver/gray bubble for user's messages
                                  : 'bg-gray-200 rounded-bl-sm' // Silver/gray bubble for other party's messages
                              }`}
                            >
                              {editingMessageId === message.id ? (
                                // Edit mode
                                <div className="space-y-2">
                                  <Textarea
                                    value={editMessageText}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      if (value.length > 10000) {
                                        value = value.substring(0, 10000);
                                      }
                                      value = value.replace(/\0/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
                                      setEditMessageText(value);
                                    }}
                                    className="text-sm min-h-[60px] max-h-[200px] resize-none border-gray-400 focus:border-blue-500"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancelEdit}
                                      disabled={isUpdatingMessage}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <XIcon className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleSaveEdit}
                                      disabled={isUpdatingMessage || !editMessageText.trim()}
                                      className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                                    >
                                      {isUpdatingMessage ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <Check className="w-3 h-3 mr-1" />
                                      )}
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // Display mode
                                <>
                                  <p 
                                    className="text-sm leading-relaxed break-words whitespace-pre-wrap font-normal text-black"
                                    style={{
                                      color: '#000000'
                                    }}
                                  >
                                    {safeMessageText(message.body)}
                                  </p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <p className="text-xs text-gray-600">
                                      {formatTime(message.created_at)}
                                    </p>
                                    {/* Edit button - only show for user's own messages that are editable */}
                                    {isCurrentUser && isMessageEditable(message) && (
                                      <button
                                        onClick={() => handleStartEdit(message)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-gray-400 rounded"
                                        title="Edit message"
                                      >
                                        <Edit2 className="w-3 h-3 text-gray-700" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Avatar for sent messages (right side) */}
                            {isCurrentUser && (
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-sky-500 text-white">
                                  {((currentUser.full_name || currentUser.email || 'U')[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end space-x-2">
                <Textarea
                  placeholder={`Message ${selectedConversation.other_participant.full_name || selectedConversation.other_participant.email}...`}
                  value={newMessage}
                  onChange={(e) => {
                    // Allow normal typing including spaces - only apply length limit
                    let value = e.target.value;
                    
                    // Security: Limit length to prevent DoS
                    if (value.length > 10000) {
                      value = value.substring(0, 10000);
                    }
                    
                    // Security: Remove null bytes and control characters (but preserve spaces, newlines, tabs)
                    value = value.replace(/\0/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
                    
                    setNewMessage(value);
                    
                    // Auto-resize textarea
                    const textarea = e.target;
                    textarea.style.height = 'auto';
                    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
                  }}
                  onKeyDown={(e) => {
                    // Allow Enter to send message, Shift+Enter for new line
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  // Security: Prevent paste of dangerous content
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text/plain');
                    if (pastedText) {
                      // Preserve spaces and newlines, only remove dangerous patterns
                      let sanitized = pastedText;
                      
                      // Limit length
                      if (sanitized.length > 10000) {
                        sanitized = sanitized.substring(0, 10000);
                      }
                      
                      // Remove dangerous patterns but preserve spaces
                      sanitized = sanitized
                        .replace(/[a-zA-Z]:[\\\/]/g, '') // Remove drive letters
                        .replace(/\.\./g, '') // Remove path traversal
                        .replace(/data:/gi, '') // Remove data URIs
                        .replace(/javascript:/gi, '') // Remove javascript: protocol
                        .replace(/\0/g, '') // Remove null bytes
                        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
                      
                      // Insert pasted text at cursor position
                      const textarea = e.target as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const currentValue = newMessage;
                      const newValue = currentValue.substring(0, start) + sanitized + currentValue.substring(end);
                      
                      // Limit total length
                      const finalValue = newValue.length > 10000 ? newValue.substring(0, 10000) : newValue;
                      
                      setNewMessage(finalValue);
                      
                      // Auto-resize after paste
                      setTimeout(() => {
                        textarea.style.height = 'auto';
                        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
                        // Restore cursor position
                        const newCursorPos = start + sanitized.length;
                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                      }, 0);
                    }
                  }}
                  // Security: Prevent file drops
                  onDrop={(e) => {
                    e.preventDefault();
                    toast.error('File uploads are not allowed in messages');
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-2xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-3 px-4"
                  rows={1}
                  // Security: Disable autocomplete to prevent sensitive data leakage
                  autoComplete="off"
                  style={{
                    overflowY: 'auto',
                    lineHeight: '1.5',
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="rounded-full h-11 w-11 p-0 bg-[#0084ff] hover:bg-[#0066cc] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
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