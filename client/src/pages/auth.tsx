import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { setToken } from "@/lib/utils";
import { useLocation } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      toast({
        title: "Welcome back!",
        description: "Login successful",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; fullName: string }) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      setIsLogin(true);
      setPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      signupMutation.mutate({ email, password, fullName });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="whatsapp-bg h-32 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold">Schat</h1>
          <p className="text-sm opacity-90">
            {isLogin ? "Connect instantly" : "Join the conversation"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-primary-custom mb-2">
            {isLogin ? "Welcome back" : "Create Account"}
          </h2>
          <p className="text-secondary-custom">
            {isLogin ? "Sign in to continue messaging" : "Start chatting with friends"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full whatsapp-bg hover:whatsapp-dark-bg text-white"
                disabled={loginMutation.isPending || signupMutation.isPending}
              >
                {loginMutation.isPending || signupMutation.isPending 
                  ? "Please wait..." 
                  : isLogin 
                    ? "Sign In" 
                    : "Create Account"
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-secondary-custom">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword("");
                setFullName("");
              }}
              className="text-green-600 font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
