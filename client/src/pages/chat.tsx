import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Phone, Video, Smile, Paperclip, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface MessageWithSender {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  status: string;
  createdAt: string;
  sender: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
  };
}

interface ChatData {
  id: number;
  user1: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
    isOnline: boolean;
  };
  user2: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
    isOnline: boolean;
  };
  messages: MessageWithSender[];
}

export default function ChatPage() {
  const [, params] = useRoute("/chat/:chatId");
  const [, setLocation] = useLocation();
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  
  const chatId = parseInt(params?.chatId || "0");
  const { isConnected, lastMessage, sendMessage } = useWebSocket();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chats", chatId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!chatId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
  });

  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ["/api/chats", chatId],
    queryFn: async () => {
      const response = await fetch(`/api/chats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chats");
      const chats = await response.json();
      return chats.find((c: ChatData) => c.id === chatId);
    },
    enabled: !!chatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        chatId,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      // Force refetch messages immediately
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      queryClient.refetchQueries({ queryKey: ["/api/chats", chatId, "messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "new_message":
        if (lastMessage.message.chatId === chatId) {
          queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
        }
        break;
      case "typing_status":
        if (lastMessage.chatId === chatId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (lastMessage.isTyping) {
              newSet.add(lastMessage.userId);
            } else {
              newSet.delete(lastMessage.userId);
            }
            return newSet;
          });
        }
        break;
    }
  }, [lastMessage, chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    
    if (isConnected && !isTyping) {
      setIsTyping(true);
      sendMessage({
        type: "typing",
        chatId,
        isTyping: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isConnected && isTyping) {
        setIsTyping(false);
        sendMessage({
          type: "typing",
          chatId,
          isTyping: false,
        });
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) return;

    sendMessageMutation.mutate(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (chatLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Chat not found</p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const otherUser = chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Chat Header */}
      <div className="whatsapp-bg text-white p-4 flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-gray-200 hover:bg-white/10"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.profileImageUrl} />
            <AvatarFallback className="bg-white/20 text-white">
              {otherUser.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium">{otherUser.fullName}</h3>
            <p className="text-xs opacity-90">
              {typingUsers.size > 0 ? "typing..." : otherUser.isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
          >
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 chat-bg bg-opacity-30 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-secondary-custom py-8">
            <p>Start the conversation by sending a message!</p>
          </div>
        ) : (
          messages.map((message: MessageWithSender) => {
            const isOwn = message.senderId === currentUser?.id;
            
            return (
              <div
                key={message.id}
                className={`flex items-end space-x-2 ${isOwn ? "justify-end" : ""}`}
              >
                <div
                  className={`message-bubble p-3 rounded-lg shadow-sm ${
                    isOwn ? "sent-msg-bg" : "received-msg-bg"
                  }`}
                >
                  <p className="text-primary-custom">{message.content}</p>
                  <div className={`flex items-center mt-1 space-x-2 ${isOwn ? "justify-end" : "justify-between"}`}>
                    <span className="text-xs text-secondary-custom">
                      {formatTime(message.createdAt)}
                    </span>
                    {isOwn && (
                      <div className="text-xs">
                        {message.status === "read" ? (
                          <span className="text-blue-500">✓✓</span>
                        ) : message.status === "delivered" ? (
                          <span className="text-gray-400">✓✓</span>
                        ) : (
                          <span className="text-gray-400">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-end space-x-2">
            <div className="received-msg-bg p-3 rounded-lg shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-animation"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-animation" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-animation" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-light-custom p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-custom hover:text-primary-custom"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-custom hover:text-primary-custom"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendMessageMutation.isPending}
            className="whatsapp-bg hover:whatsapp-dark-bg text-white w-10 h-10 rounded-full p-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
