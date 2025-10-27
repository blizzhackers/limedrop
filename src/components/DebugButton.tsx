import { Bug } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { toggleDebugInfo, useAppStore } from "@/stores/appStore";

export const DebugButton = memo(() => {
  const showDebugInfo = useAppStore((s) => s.showDebugInfo);

  return (
    <Button
      onClick={toggleDebugInfo}
      size="icon"
      className={`fixed bottom-6 left-6 h-12 w-12 rounded-full shadow-lg transition-colors z-40 ${
        showDebugInfo
          ? "bg-lime-600 hover:bg-lime-700"
          : "bg-gray-700 hover:bg-gray-600"
      }`}
      title={showDebugInfo ? "Hide debug info" : "Show debug info"}
    >
      <Bug className="h-5 w-5" />
    </Button>
  );
});

DebugButton.displayName = "DebugButton";
