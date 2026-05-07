import type React from "react";
import type { InventoryItem } from "@/lib/utils";
import { isV2Item } from "@/lib/utils";

interface ItemDebugPanelProps {
  item: InventoryItem;
}

export const ItemDebugPanel: React.FC<ItemDebugPanelProps> = ({ item }) => {
  const isV2 = isV2Item(item);

  return (
    <div className="w-full h-full flex flex-col text-xs overflow-y-auto">
      <div className="text-white space-y-1">
        <div className="font-semibold text-center text-sm mb-2 border-b border-gray-600 pb-1">
          Item Debug Info {isV2 ? "(V2)" : "(V1)"}
        </div>
        <div>
          <span className="text-gray-400">ID:</span> {item.gid}
        </div>
        <div>
          <span className="text-gray-400">Account:</span> {item.account}
        </div>
        <div>
          <span className="text-gray-400">Character:</span> {item.character}
        </div>
        <div>
          <span className="text-gray-400">Ladder:</span>{" "}
          {item.ladder ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-gray-400">Quality:</span> {item.quality}
        </div>
        <div>
          <span className="text-gray-400">Item Class:</span> {item.itemClass}
        </div>
        <div>
          <span className="text-gray-400">Item Type:</span> {item.itemType}
        </div>
        <div>
          <span className="text-gray-400">Ethereal:</span>{" "}
          {item.ethereal ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-gray-400">Runeword:</span>{" "}
          {item.runeword ? "Yes" : "No"}
        </div>
        <div>
          <span className="text-gray-400">Sockets:</span> {item.sockets || 0}
        </div>

        {isV2 && (
          <div className="mt-2 pt-2 border-gray-600">
            <div className="text-lime-400 font-semibold mb-1">
              V2 Extended Info
            </div>
            <div>
              <span className="text-gray-400">ID:</span> {item.id}
            </div>
            <div>
              <span className="text-gray-400">Mode:</span> {item.mode ?? "N/A"}
            </div>
            <div>
              <span className="text-gray-400">Code:</span> {item.code}
            </div>
            <div>
              <span className="text-gray-400">Name:</span> {item.name}
            </div>
            <div>
              <span className="text-gray-400">Item Level:</span> {item.ilvl}
            </div>
            <div>
              <span className="text-gray-400">Level Req:</span> {item.lvlreq}
            </div>
            <div>
              <span className="text-gray-400">Str Req:</span> {item.strreq}
            </div>
            <div>
              <span className="text-gray-400">Dex Req:</span> {item.dexreq}
            </div>
            <div>
              <span className="text-gray-400">Color:</span> {item.color}
            </div>
            <div>
              <span className="text-gray-400">GFX:</span> {item.gfx}
            </div>
            <div>
              <span className="text-gray-400">Flags:</span> {item.flags}
            </div>
            {item.prefix && (
              <div>
                <span className="text-gray-400">Prefix:</span> {item.prefix}
              </div>
            )}
            {item.suffix && (
              <div>
                <span className="text-gray-400">Suffix:</span> {item.suffix}
              </div>
            )}
            {item.prefixnum !== undefined && (
              <div>
                <span className="text-gray-400">Prefix Num:</span>{" "}
                {item.prefixnum}
              </div>
            )}
            {item.suffixnum !== undefined && (
              <div>
                <span className="text-gray-400">Suffix Num:</span>{" "}
                {item.suffixnum}
              </div>
            )}
            {item.prefixes.length > 0 && (
              <div>
                <span className="text-gray-400">Prefixes:</span>{" "}
                {item.prefixes.join(", ")}
              </div>
            )}
            {item.suffixes.length > 0 && (
              <div>
                <span className="text-gray-400">Suffixes:</span>{" "}
                {item.suffixes.join(", ")}
              </div>
            )}
            {item.prefixnums.length > 0 && (
              <div>
                <span className="text-gray-400">Prefix Nums:</span>{" "}
                {item.prefixnums.join(", ")}
              </div>
            )}
            {item.suffixnums.length > 0 && (
              <div>
                <span className="text-gray-400">Suffix Nums:</span>{" "}
                {item.suffixnums.join(", ")}
              </div>
            )}
            {Object.keys(item.stats).length > 0 && (
              <div className="mt-2">
                <div className="text-gray-400 font-medium mb-1">Stats:</div>
                <div className="pl-2 space-y-0.5 max-h-32 overflow-y-auto">
                  {Object.entries(item.stats).map(([key, value]) => (
                    <div key={key} className="text-gray-300">
                      <span className="text-gray-500">{key}:</span>{" "}
                      {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <span className="text-gray-400">Title:</span> {item.title}
        </div>
        {item.description && (
          <div className="mt-2">
            <div className="text-gray-400 font-medium">Raw Description:</div>
            <div className="text-gray-300 text-xs break-words">
              {item.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
