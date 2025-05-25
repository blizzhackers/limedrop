import { renderColorText } from "@/lib/util";
import {
  setRecentDropsOpen,
  updateCachedDrops,
  useAppStore,
} from "@/stores/useAppStore";
import { X } from "lucide-react";
import type React from "react";
import { memo, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { ScrollArea } from "./ui/scroll-area";

interface RecentDropsProps {
  session: string | null;
}

export const RecentDrops: React.FC<RecentDropsProps> = memo(({ session }) => {
  const recentDropsOpen = useAppStore((s) => s.recentDropsOpen);
  const drops = useAppStore((s) => s.drops);

  useEffect(() => {
    updateCachedDrops();
  }, []);

  return (
    <Drawer
      open={recentDropsOpen && !!session}
      onOpenChange={setRecentDropsOpen}
      direction="bottom"
    >
      <DrawerContent className="w-screen max-w-screen h-full bg-gray-800 shadow-lg flex flex-col">
        <div className="bg-gray-800 rounded p-4">
          <DrawerHeader className="flex items-center justify-between mb-4 p-0">
            <DrawerTitle className="text-2xl text-white font-bold">
              Recent Drops
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:bg-red-500 absolute top-0 right-0 m-2"
                onClick={() => setRecentDropsOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <ScrollArea className="flex-1 h-[calc(80vh-100px)]">
            {drops.length === 0 ? (
              <div className="text-gray-400">No recent drops.</div>
            ) : (
              <ul className="divide-y divide-gray-700 ml-1 pr-3">
                {drops.map((drop) => (
                  <li key={drop.id} className="py-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="text-white">
                        <span className="font-semibold">Game:</span>{" "}
                        {drop.gameName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 md:mt-0">
                        {new Date(drop.droppedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm mt-2">
                      <span className="font-semibold text-white">Items:</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                        {drop.items.map((item, idx) => {
                          const title = item.description
                            ? item.description.split("$", 1)[0]
                            : "";
                          let desc = item.description || "";
                          if (desc.startsWith(title))
                            desc = desc.slice(title.length);

                          return (
                            <div
                              key={item.itemid || idx}
                              className={
                                "bg-gray-700 rounded p-2 flex flex-col items-center shadow-filter relative cursor-pointer transition-all duration-100 " +
                                "hover:ring-2 hover:ring-green-400"
                              }
                              style={{ minHeight: 140 }}
                            >
                              {item.image && (
                                <img
                                  src={`data:image/jpeg;base64,${item.image}`}
                                  alt={"item"}
                                  className="ld-item mb-2"
                                  style={{
                                    maxWidth: 80,
                                    maxHeight: 80,
                                    imageRendering: "crisp-edges",
                                  }}
                                />
                              )}
                              <div className="comment-text w-full text-center">
                                <div className="font-semibold text-xs">
                                  {renderColorText(title)}
                                </div>
                                <div className="text-sm">
                                  {renderColorText(desc)}
                                </div>
                                <div>
                                  {item.account} / {item.character}
                                </div>
                                <div className=" text-gray-500 whitespace-nowrap">
                                  {item.itemid}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
});
