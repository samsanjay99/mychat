import { useLocation } from "wouter";
import { MessageCircle, Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  onProfileClick: () => void;
}

export function BottomNavigation({ onProfileClick }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    {
      icon: MessageCircle,
      label: "Chats",
      path: "/",
      isActive: location === "/",
    },
    {
      icon: Search,
      label: "Search",
      path: "/search",
      isActive: location === "/search",
    },
    {
      icon: MoreHorizontal,
      label: "More",
      onClick: onProfileClick,
      isActive: false,
    },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.path) {
                  setLocation(item.path);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px]",
                item.isActive
                  ? "text-whatsapp scale-110"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon 
                className={cn(
                  "h-6 w-6 mb-1 transition-all duration-200",
                  item.isActive && "animate-pulse"
                )} 
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}