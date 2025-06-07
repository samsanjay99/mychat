import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { isTokenValid } from "@/lib/utils";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import AuthPage from "@/pages/auth";
import ChatListPage from "@/pages/chat-list";
import SearchPage from "@/pages/search";
import ChatPage from "@/pages/chat";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const valid = isTokenValid();
      setIsAuthenticated(valid);
      setIsLoading(false);
    };

    checkAuth();
    
    // Check auth status on focus/storage changes
    window.addEventListener('focus', checkAuth);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <Switch>
        <Route path="/" component={ChatListPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/chat/:chatId" component={ChatPage} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center text-secondary-custom">
              <p>Page not found</p>
            </div>
          </div>
        </Route>
      </Switch>
      
      <BottomNavigation onProfileClick={() => setIsProfileOpen(true)} />
      <ProfileDrawer open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl relative">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
