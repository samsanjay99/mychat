import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, Copy, Settings, LogOut } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { removeToken } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSettled: () => {
      removeToken();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    },
  });

  const copySchatId = async () => {
    if (user?.schatId) {
      try {
        await navigator.clipboard.writeText(user.schatId);
        toast({
          title: "Copied!",
          description: "Schat ID copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy manually: " + user.schatId,
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load profile</p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="whatsapp-bg text-white p-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-gray-200 hover:bg-white/10"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Profile Picture */}
        <div className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 mx-auto">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
                {user.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
            >
              <Camera className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
          <p className="mt-3 text-green-600 text-sm font-medium">Change Photo</p>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-secondary-custom mb-1">
                Full Name
              </label>
              <p className="text-primary-custom font-medium">{user.fullName}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-secondary-custom mb-1">
                Email
              </label>
              <p className="text-primary-custom">{user.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-secondary-custom mb-1">
                Your Schat ID
              </label>
              <div className="flex items-center justify-between">
                <p className="text-primary-custom font-mono">{user.schatId}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySchatId}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-secondary-custom mt-1">
                Share this ID with friends to start chatting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-secondary-custom mb-1">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <div className="online-indicator"></div>
                <p className="text-primary-custom">
                  {user.isOnline ? "Online" : "Last seen recently"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Settings feature will be available soon",
              });
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
