import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@/lib/utils";
import { setGameName } from "@/stores/useAppStore";
import { Trash2, X } from "lucide-react";
import type React from "react";

interface CartDrawerProps {
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  cart: InventoryItem[];
  handleRemoveFromCart: (item: InventoryItem) => void;
  gameName: string;
  gamePass: string;
  setGamePass: (v: string) => void;
  handleDropCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cartOpen,
  setCartOpen,
  cart,
  handleRemoveFromCart,
  gameName,
  gamePass,
  setGamePass,
  handleDropCart,
}) => (
  <Drawer direction="right" open={cartOpen} onOpenChange={setCartOpen}>
    <DrawerContent className="w-96 max-w-full h-full bg-gray-800 shadow-lg p-4 flex flex-col">
      <DrawerHeader className="flex items-center justify-between mb-4 p-0">
        <DrawerTitle className="text-2xl text-white font-bold">
          Drop List
        </DrawerTitle>
        <DrawerClose asChild>
          <button className="text-gray-400 hover:text-white absolute top-0 right-0 m-2">
            <X className="w-6 h-6" />
          </button>
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
            className="p-2 rounded bg-gray-900 border border-gray-700 text-white"
            placeholder="Game Name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
          />
          <Input
            className="p-2 rounded bg-gray-900 border border-gray-700 text-white"
            placeholder="Game Password (optional)"
            value={gamePass}
            onChange={(e) => setGamePass(e.target.value)}
          />
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
