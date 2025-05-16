import { renderColorText } from "@/lib/util";
import type { InventoryItem } from "@/lib/utils";
import { addToCart, removeFromCart, useAppStore } from "@/stores/useAppStore";
import type React from "react";
import { memo } from "react";

interface InventoryCardProps {
  item: InventoryItem;
}

export const InventoryCard: React.FC<InventoryCardProps> = memo(({ item }) => {
  const inCart = useAppStore((s) => s.cartItemIds.has(item.itemid));

  const title = item.description ? item.description.split("$", 1)[0] : "";
  let desc = item.description || "";
  if (desc.startsWith(title)) desc = desc.slice(title.length);

  const handleClick = () => {
    if (inCart) {
      removeFromCart(item);
    } else {
      addToCart(item);
    }
  };

  return (
    <div
      className={
        `bg-gray-700 rounded p-2 flex flex-col items-center shadow-filter relative cursor-pointer transition-all duration-100 ` +
        (inCart
          ? "ring-2 ring-green-400 bg-green-950"
          : "hover:ring-2 hover:ring-green-400")
      }
      style={{ minHeight: 160 }}
      onClick={handleClick}
      title={inCart ? "Remove from Drop List" : "Add to Drop List"}
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
      <div className="comment-text w-full text-center pb-7">
        <div className="font-semibold text-base">{renderColorText(title)}</div>
        <div className="text-sm">{renderColorText(desc)}</div>
      </div>
      <div className="absolute bottom-2 left-0 w-full px-2 flex flex-row justify-between text-xs text-gray-400 items-center">
        <span>
          {item.account} / {item.character}
        </span>
        <span className="ml-2 text-gray-500 whitespace-nowrap">
          {item.itemid}
        </span>
      </div>
      {inCart && (
        <span className="absolute top-2 right-2 bg-green-600 text-xs px-2 py-0.5 rounded-full text-white">
          In Drop List
        </span>
      )}
    </div>
  );
});

InventoryCard.displayName = "InventoryCard";
