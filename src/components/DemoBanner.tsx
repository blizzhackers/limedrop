import type React from "react";
import { memo } from "react";
import { setLoginOpen, useAppStore } from "@/stores/appStore";
import { Button } from "./ui/button";

export const DemoBanner: React.FC = memo(() => {
  const username = useAppStore((s) => s.username);
  const session = useAppStore((s) => s.session);
  if (username !== "demo" || !session) return null;
  return (
    <div className="w-full flex items-center justify-between gap-2 px-3 py-1 bg-orange-950/80 border-b border-orange-700/50 text-xs shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse shrink-0" />
        <span className="text-orange-200 font-medium">Demo Mode</span>
        <span className="text-orange-300/60 hidden sm:inline">
          You&apos;re viewing sample inventory data
        </span>
      </div>
      <Button
        onClick={() => setLoginOpen(true)}
        size="sm"
        className="bg-orange-600 hover:bg-orange-500 text-white px-3 h-6 text-xs shrink-0"
      >
        Sign In
      </Button>
    </div>
  );
});

DemoBanner.displayName = "DemoBanner";
