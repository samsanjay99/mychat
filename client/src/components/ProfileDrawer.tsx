import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Copy, LogOut, Edit3, Check, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { removeToken } from "@/lib/utils";
import { useLocation } from "wouter";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [nameText, setNameText] = useState("");

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
        title: "Logged out successfully",
        description: "You have been signed out",
      });
      onOpenChange(false);
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

  const handleStatusEdit = () => {
    setStatusText(user?.status || "Hey there! I am using Schat.");
    setIsEditingStatus(true);
  };

  const handleNameEdit = () => {
    setNameText(user?.fullName || "");
    setIsEditingName(true);
  };

  const saveStatus = () => {
    // TODO: Implement status update API
    toast({
      title: "Status updated",
      description: "Your status has been updated",
    });
    setIsEditingStatus(false);
  };

  const saveName = () => {
    // TODO: Implement name update API
    toast({
      title: "Name updated",
      description: "Your name has been updated",
    });
    setIsEditingName(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="whatsapp-bg text-white p-6 pb-20">
            <SheetTitle className="text-white text-left">Profile</SheetTitle>
          </SheetHeader>

          {/* Profile Picture */}
          <div className="relative -mt-16 mx-6 mb-6">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-0 right-0 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-full w-8 h-8 shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="flex-1 px-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Name</Label>
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={nameText}
                    onChange={(e) => setNameText(e.target.value)}
                    className="flex-1"
                    placeholder="Enter your name"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveName}
                    className="text-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(false)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-primary-custom font-medium">{user?.fullName}</span>
                  <Button variant="ghost" size="sm" onClick={handleNameEdit}>
                    <Edit3 className="h-4 w-4 text-secondary-custom" />
                  </Button>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">About</Label>
              {isEditingStatus ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    className="flex-1"
                    placeholder="Enter your status"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveStatus}
                    className="text-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingStatus(false)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-primary-custom">
                    {user?.status || "Hey there! I am using Schat."}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleStatusEdit}>
                    <Edit3 className="h-4 w-4 text-secondary-custom" />
                  </Button>
                </div>
              )}
            </div>

            {/* Schat ID */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Schat ID</Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-custom font-mono text-sm">{user?.schatId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySchatId}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-secondary-custom">
                Share this ID with friends to start chatting
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Email</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-custom">{user?.email}</span>
              </div>
            </div>

            {/* Online Status */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Status</Label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <div className="online-indicator"></div>
                <span className="text-primary-custom">
                  {user?.isOnline ? "Online" : "Last seen recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-6 border-t">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}