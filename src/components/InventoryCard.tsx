import { AlertCircle, RotateCcw } from "lucide-react";
import type React from "react";
import { memo, useEffect, useState } from "react";
import { renderColorText } from "@/lib/util";
import type { InventoryItem } from "@/lib/utils";
import { isV2Item } from "@/lib/utils";
import { addToCart, removeFromCart, useAppStore } from "@/stores/appStore";

interface InventoryCardProps {
  item: InventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = memo(({ item }) => {
  const inCart = useAppStore((s) => s.cartItemIds.has(item.itemid));
  const showDebugInfo = useAppStore((s) => s.showDebugInfo);

  const [isFlipped, setIsFlipped] = useState(false);
  const isV2 = isV2Item(item);

  const title = item.description ? item.description.split("$", 1)[0] : "";
  let desc = item.description || "";
  if (desc.startsWith(title)) {
    desc = desc.slice(title.length);
  }

  useEffect(() => {
    const debugSubscription = useAppStore.subscribe(
      (state) => state.showDebugInfo,
      (value) => {
        if (!value) {
          setIsFlipped(false);
        }
      },
    );
    return () => {
      debugSubscription();
    };
  }, []);

  const handleClick = () => {
    if (inCart) {
      removeFromCart(item);
    } else {
      addToCart(item);
    }
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`bg-gray-700 rounded p-2 flex flex-col items-center shadow-filter relative cursor-pointer transition-all duration-300 ${
        inCart
          ? "ring-2 ring-green-400 bg-green-950"
          : "hover:ring-2 hover:ring-green-400"
      }`}
      style={{
        minHeight: 160,
        perspective: "1000px",
      }}
      onClick={!isFlipped ? handleClick : undefined}
      title={
        !isFlipped
          ? inCart
            ? "Remove from Drop List"
            : "Add to Drop List"
          : ""
      }
    >
      {!isFlipped ? (
        <>
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
          <div className="comment-text w-full text-center pb-7">
            <div className="font-semibold text-xs desktop:text-sm portrait:text-base ultrawide:text-base">
              {renderColorText(title)}
            </div>
            <div className="text-xs h-lg:text-sm">{renderColorText(desc)}</div>
          </div>
          <div className="absolute bottom-2 left-0 w-full px-2 flex flex-row justify-between text-xs text-gray-400 items-center">
            <span>
              {item.account} / {item.character}
            </span>
            <span className="ml-2 text-gray-500 whitespace-nowrap">
              {item.itemid.split(":")[0]}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Flipped debug content */}
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
                <span className="text-gray-400">Character:</span>{" "}
                {item.character}
              </div>
              <div>
                <span className="text-gray-400">Ladder:</span>{" "}
                {item.ladder ? "Yes" : "No"}
              </div>
              <div>
                <span className="text-gray-400">Quality:</span> {item.quality}
              </div>
              <div>
                <span className="text-gray-400">Item Class:</span>{" "}
                {item.itemClass}
              </div>
              <div>
                <span className="text-gray-400">Item Type:</span>{" "}
                {item.itemType}
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
                <span className="text-gray-400">Sockets:</span>{" "}
                {item.sockets || 0}
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
                    <span className="text-gray-400">Code:</span> {item.code}
                  </div>
                  <div>
                    <span className="text-gray-400">Name:</span> {item.name}
                  </div>
                  <div>
                    <span className="text-gray-400">Item Level:</span>{" "}
                    {item.ilvl}
                  </div>
                  <div>
                    <span className="text-gray-400">Level Req:</span>{" "}
                    {item.lvlreq}
                  </div>
                  <div>
                    <span className="text-gray-400">Str Req:</span>{" "}
                    {item.strreq}
                  </div>
                  <div>
                    <span className="text-gray-400">Dex Req:</span>{" "}
                    {item.dexreq}
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
                      <span className="text-gray-400">Prefix:</span>{" "}
                      {item.prefix}
                    </div>
                  )}
                  {item.suffix && (
                    <div>
                      <span className="text-gray-400">Suffix:</span>{" "}
                      {item.suffix}
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
                      <div className="text-gray-400 font-medium mb-1">
                        Stats:
                      </div>
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
                  <div className="text-gray-400 font-medium">
                    Raw Description:
                  </div>
                  <div className="text-gray-300 text-xs break-words">
                    {item.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* V1 Update Banner */}
      {!isV2 && (
        <div
          className="absolute top-0 right-0 bg-yellow-600 text-black text-xs px-2 py-1 rounded-t flex items-center gap-1 z-10"
          title="This item uses the legacy V1 format with limited metadata. Re-logging this item in-game will upgrade it to V2 format with enhanced filtering capabilities including item stats, affixes, and more detailed information."
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span className="font-semibold">V1 item</span>
        </div>
      )}

      {showDebugInfo && (
        <button
          type="button"
          className="absolute top-2 left-2 bg-gray-600 hover:bg-gray-500 text-white p-1 rounded-full transition-colors z-10"
          onClick={handleFlip}
          title="Flip card to see details"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      {inCart && (
        <span className="absolute top-2 right-2 bg-green-600 text-xs px-2 py-0.5 rounded-full text-white z-10">
          In Drop List
        </span>
      )}
    </div>
  );
});

InventoryCard.displayName = "InventoryCard";
