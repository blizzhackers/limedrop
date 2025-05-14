import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import type { D2BotAPI } from "@/lib/D2Bot";
import { addRecentDrop } from "@/lib/recentDropsDb";
import type { InventoryItem } from "@/lib/utils";
import {
  clearCart,
  removeFromCart,
  setGameName,
  useAppStore,
} from "@/stores/useAppStore";
import { Eye, EyeOff, Trash2, X } from "lucide-react";
import { useState } from "react";
import type React from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface CartDrawerProps {
  api: D2BotAPI;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  handleClearDropsFromInvo: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  api,
  cartOpen,
  setCartOpen,
  handleClearDropsFromInvo,
}) => {
  const realm = useAppStore((s) => s.realm);
  const username = useAppStore((s) => s.username);
  const gameName = useAppStore((s) => s.gameName);
  const cart = useAppStore((s) => s.cart);

  const [gamePass, setGamePass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleRemoveFromCart(item: InventoryItem) {
    removeFromCart(item);
  }

  async function handleDropCart() {
    if (!cart.length) return;
    if (!gameName) {
      toast.error("Drop Queue", { description: "Game name is required!" });
      return;
    }
    // Group by hash (realm+account)
    const drops: Record<string, Partial<InventoryItem>[]> = {};
    for (const item of cart) {
      const hash = await api.md5(
        realm.toLowerCase() + (item.account || "").toLowerCase(),
      );
      if (!drops[hash]) drops[hash] = [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { image, description, ...cleanItem } = item;
      drops[hash].push(cleanItem);
    }
    for (const hash in drops) {
      const GameInfo = {
        hash,
        profile: username,
        action: "doDrop",
        data: JSON.stringify({ gameName, gamePass, items: drops[hash] }),
      };
      console.debug("GameAction", JSON.stringify(GameInfo, null, 2));
      await api.gameaction(GameInfo);
    }
    try {
      await addRecentDrop({
        items: cart,
        gameName,
        username,
      });
    } catch (err) {
      console.error("Failed to store recent drop", err);
    }
    handleClearDropsFromInvo();
    clearCart();
    setCartOpen(false);
    toast.info("Drop Queue", { description: "Drop action sent!" });
  }

  return (
    <Drawer direction="right" open={cartOpen} onOpenChange={setCartOpen}>
      <DrawerContent className="w-96 max-w-full h-full bg-gray-800 shadow-lg p-4 flex flex-col">
        <DrawerHeader className="flex items-center justify-between mb-4 p-0">
          <DrawerTitle className="text-2xl text-white font-bold">
            Drop List
          </DrawerTitle>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:bg-red-500 absolute top-0 right-0 m-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <form
          className="flex flex-col flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            handleDropCart();
          }}
        >
          <div className="mb-4 flex flex-col gap-2">
            <Input
              type="text"
              autoComplete="off"
              className="p-2 rounded bg-gray-900 border border-gray-700 text-white"
              placeholder="Game Name"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                className="p-2 rounded bg-gray-900 border border-gray-700 text-white pr-10"
                placeholder="Game Password (optional)"
                value={gamePass}
                onChange={(e) => setGamePass(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1.5 text-gray-400 hover:text-white"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-gray-400">No items in drop list.</div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.itemid || idx}
                  className="bg-gray-700 rounded p-2 mb-2 flex flex-row items-center"
                >
                  {item.image && (
                    <img
                      src={`data:image/jpeg;base64,${item.image}`}
                      alt={"item"}
                      className="ld-item mr-2"
                      style={{
                        maxWidth: 48,
                        maxHeight: 48,
                        imageRendering: "crisp-edges",
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">
                      {item.account} / {item.character} / {item.itemid}
                    </div>
                  </div>
                  <button
                    className="ml-2 text-red-400 hover:text-red-600"
                    onClick={() => handleRemoveFromCart(item)}
                    title="Remove"
                    type="button"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <DrawerFooter className="mt-4 p-0">
            <button
              className="bg-green-600 hover:bg-green-700 text-white rounded p-2 font-semibold disabled:opacity-50"
              disabled={cart.length === 0}
              type="submit"
            >
              Drop Items
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
