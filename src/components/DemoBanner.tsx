import type React from "react";
import { memo } from "react";
import { setLoginOpen, useAppStore } from "@/stores/appStore";
import { Button } from "./ui/button";

interface DemoBannerProps {
  session: string | null;
}

export const DemoBannerMobile: React.FC<DemoBannerProps> = memo(
  ({ session }) => {
    const username = useAppStore((s) => s.username);
    if (username !== "demo" || !session) return null;
    return (
      <div className="flex md:hidden items-center justify-between gap-1 px-2 py-1 mb-1 bg-orange-900/50 border border-orange-600/50 rounded text-xs">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
          <span className="text-orange-200 font-medium text-xs">Demo</span>
          <span className="text-orange-300/70 text-xs">
            You're viewing sample inventory data
          </span>
        </div>
        <Button
          onClick={() => setLoginOpen(true)}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-0.5 h-5 ml-1"
        >
          Sign In
        </Button>
      </div>
    );
  },
);

export const DemoBannerDesktop: React.FC<DemoBannerProps> = memo(
  ({ session }) => {
    const username = useAppStore((s) => s.username);
    if (username !== "demo" || !session) return null;
    return (
      <div className="hidden md:block mb-4 bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-600/50 rounded p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-orange-200 font-medium text-sm">
              Demo Mode
            </span>
            <span className="text-orange-300/70 text-xs">
              You're viewing sample inventory data
            </span>
          </div>
          <Button
            onClick={() => setLoginOpen(true)}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  },
);

DemoBannerMobile.displayName = "DemoBannerMobile";
DemoBannerDesktop.displayName = "DemoBannerDesktop";
