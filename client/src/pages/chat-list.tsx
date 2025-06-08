import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: number;
  fullName: string;
  email: string;
  schatId: string;
  profileImageUrl?: string;
  isOnline: boolean;
}

interface ChatListItem {
  id: number;
  user1: User;
  user2: User;
  messages: Array<{
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
    status: string;
  }>;
  updatedAt: string;
}

export default function ChatListPage() {
  const [, setLocation] = useLocation();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: chats = [], isLoading } = useQuery<ChatListItem[]>({
    queryKey: ["/api/chats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const getOtherUser = (chat: ChatListItem) => {
    return chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;
  };

  const getLastMessage = (chat: ChatListItem) => {
    return chat.messages?.[0] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="whatsapp-bg text-white p-4 flex items-center space-x-3">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-green-600" />
        </div>
        <h1 className="text-xl font-semibold">Schat</h1>
      </div>

      {/* Chat List */}
      <div className="divide-y border-light-custom">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-secondary-custom">
            <div className="mb-4">
              <Plus className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium mb-2">No chats yet</p>
            <p className="text-sm mb-4">Start a conversation by searching for users</p>
            <Button
              onClick={() => setLocation("/search")}
              className="whatsapp-bg hover:whatsapp-dark-bg text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        ) : (
          chats.map((chat: ChatListItem) => {
            const otherUser = getOtherUser(chat);
            const lastMessage = getLastMessage(chat);
            
            return (
              <div
                key={chat.id}
                onClick={() => setLocation(`/chat/${chat.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.profileImageUrl} />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {otherUser.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {otherUser.isOnline && (
                    <div className="online-indicator absolute -bottom-1 -right-1"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-primary-custom truncate">
                      {otherUser.fullName}
                    </h3>
                    <span className="text-xs text-secondary-custom">
                      {lastMessage ? formatDate(lastMessage.createdAt) : formatDate(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-secondary-custom truncate">
                      {lastMessage ? (
                        <>
                          {lastMessage.senderId === currentUser?.id && "You: "}
                          {lastMessage.content}
                        </>
                      ) : (
                        "Start the conversation..."
                      )}
                    </p>
                    
                    {lastMessage && lastMessage.senderId === currentUser?.id && (
                      <div className="flex items-center space-x-1 ml-2">
                        {lastMessage.status === 'read' ? (
                          <div className="text-blue-500 text-xs">✓✓</div>
                        ) : lastMessage.status === 'delivered' ? (
                          <div className="text-gray-400 text-xs">✓✓</div>
                        ) : (
                          <div className="text-gray-400 text-xs">✓</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button - positioned above More button */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2">
        <Button
          onClick={() => setLocation("/search")}
          className="whatsapp-bg hover:whatsapp-dark-bg text-white w-14 h-14 rounded-full shadow-lg"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
