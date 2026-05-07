import { AlertCircle, RotateCcw } from "lucide-react";
import type React from "react";
import { memo, useMemo, useState } from "react";
import { renderColorText } from "@/lib/util";
import type { InventoryItem } from "@/lib/utils";
import { isV2Item, parseItemDescription } from "@/lib/utils";
import { addToCart, removeFromCart, useAppStore } from "@/stores/appStore";
import { ItemDebugPanel } from "./ItemDebugPanel";

interface InventoryCardProps {
  item: InventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = memo(({ item }) => {
  const inCart = useAppStore((s) => s.cartItemIds.has(item.itemid));
  const showDebugInfo = useAppStore((s) => s.showDebugInfo);

  const [isFlipped, setIsFlipped] = useState(false);
  const isV2 = isV2Item(item);

  const { title, desc } = useMemo(
    () => parseItemDescription(item.description),
    [item.description],
  );

  // Only show flipped state when debug info is enabled
  const effectiveIsFlipped = isFlipped && showDebugInfo;

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
      onClick={!effectiveIsFlipped ? handleClick : undefined}
      title={
        !effectiveIsFlipped
          ? inCart
            ? "Remove from Drop List"
            : "Add to Drop List"
          : ""
      }
    >
      {!effectiveIsFlipped ? (
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
            <div className="font-semibold text-xs mobile:text-xs desktop:text-sm portrait:text-base ultrawide:text-base">
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
        <ItemDebugPanel item={item} />
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

      {isV2 && item.equipped && (
        <span
          className={`absolute top-2 bg-blue-500 text-xs px-2 py-0.5 rounded-full text-white z-10 ${
            showDebugInfo ? "left-10" : "left-2"
          }`}
        >
          Equipped
        </span>
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
