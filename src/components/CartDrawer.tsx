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
import { FieldInfo, renderColorText } from "@/lib/util";
import type { InventoryItem } from "@/lib/utils";
import {
  clearCart,
  handleClearDropsFromInvo,
  removeFromCart,
  setCartOpen,
  setGameName,
  updateCachedDrops,
  useAppStore,
} from "@/stores/useAppStore";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Trash2, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { FixedSizeList } from "react-window";
import type { ListChildComponentProps } from "react-window";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface CartDrawerProps {
  api: D2BotAPI;
  session: string | null;
  handleSignOut: () => void;
}

const CartItemRow = memo(({ index, style, data }: ListChildComponentProps) => {
  const item = data.cart[index];
  const handleRemoveFromCart = data.handleRemoveFromCart;
  const title = item.description ? item.description.split("$", 1)[0] : "";
  let desc = item.description || "";
  if (desc.startsWith(title)) desc = desc.slice(title.length);
  return (
    <div key={item.itemid || index} style={style}>
      <div className="bg-gray-700 h-[96%] rounded p-2 mb-2 flex flex-row items-center">
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
          <div className="w-full text-left pb-1">
            <div className="font-semibold text-xs md:text-sm line-clamp-4 overflow-hidden text-ellipsis">
              {renderColorText(title)}
            </div>
            <div className="text-xs line-clamp-2 overflow-hidden text-ellipsis">
              {renderColorText(desc)}
            </div>
          </div>
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
    </div>
  );
});

export const CartDrawer: React.FC<CartDrawerProps> = memo(
  ({ api, session, handleSignOut }) => {
    const realm = useAppStore((s) => s.realm);
    const username = useAppStore((s) => s.username);
    const gameName = useAppStore((s) => s.gameName);
    const cart = useAppStore((s) => s.cart);
    const cartOpen = useAppStore((s) => s.cartOpen);

    const [showPassword, setShowPassword] = useState(false);
    const pollingIntervalRef = useRef<number | null>(null);
    const pollingCounterRef = useRef(0);
    const pollingTimeoutRef = useRef<number | null>(null);

    const form = useForm({
      defaultValues: {
        gameName: gameName,
        gamePass: "",
      },
      onSubmit: async ({ value }) => {
        if (!cart.length) return;

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

        startPolling();

        for (const hash in drops) {
          const GameInfo = {
            hash,
            profile: username,
            action: "doDrop",
            data: JSON.stringify({
              gameName: value.gameName,
              gamePass: value.gamePass,
              items: drops[hash],
            }),
          };
          await api.gameaction(GameInfo);
        }

        try {
          await addRecentDrop({
            items: cart,
            gameName: value.gameName,
            username,
          });
          updateCachedDrops();
        } catch (err) {
          console.error("Failed to store recent drop", err);
        }

        // Update the global state with the game name
        setGameName(value.gameName);

        handleClearDropsFromInvo();
        clearCart();
        setCartOpen(false);
        toast.info("Drop Queue", { description: "Drop action sent!" });
      },
    });

    const stopPolling = useCallback(() => {
      if (pollingIntervalRef.current !== null) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current !== null) {
        window.clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      pollingCounterRef.current = 0;
    }, []);

    const startPolling = useCallback(() => {
      stopPolling();

      pollingIntervalRef.current = window.setInterval(async () => {
        // Only poll every ~2 seconds (20 * 100ms)
        if (pollingCounterRef.current > 20) {
          pollingCounterRef.current = 0;

          try {
            const { status, body } = await api.poll();

            // Handle failed responses with invalid session
            if (status === "failed" && body === "invalid session") {
              console.log(
                "Polling detected invalid session, may need to log in again",
              );

              let sessionFailCount = window.sessionFailCount || 0;
              sessionFailCount++;
              window.sessionFailCount = sessionFailCount;

              if (sessionFailCount > 3) {
                console.error("Too many failed session attempts, logging out");
                handleSignOut();
                toast.error("Session Error", {
                  description: "Your session has expired, please log in again",
                });
                window.sessionFailCount = 0;
              }
              return;
            }

            // Reset the failure counter on success
            window.sessionFailCount = 0;

            // Handle empty response
            if (
              body === "empty" ||
              (status === "success" && (body || body === "empty"))
            ) {
              return;
            }

            if (body && Array.isArray(body)) {
              for (const message of body) {
                if (message?.body) {
                  console.debug(message);
                  try {
                    const data = JSON.parse(message.body);
                    toast.info("Game Action", { description: data.data });
                  } catch (parseError) {
                    console.error(
                      "Error parsing message:",
                      parseError,
                      message,
                    );
                  }
                }
              }
            }
          } catch (error) {
            console.error("Polling error:", error);

            if (
              error instanceof Error &&
              error.message.includes("invalid session")
            ) {
              // Don't flood the console with repeated errors
              console.log("Polling error with invalid session");

              let sessionFailCount = window.sessionFailCount || 0;
              sessionFailCount++;
              window.sessionFailCount = sessionFailCount;

              if (sessionFailCount > 3) {
                console.error("Too many failed session attempts, logging out");
                handleSignOut();
                toast.error("Session Error", {
                  description: "Your session has expired, please log in again",
                });
                window.sessionFailCount = 0;
              }
            }
          }
        } else {
          pollingCounterRef.current++;
        }
      }, 100);

      pollingTimeoutRef.current = window.setTimeout(
        () => {
          stopPolling();
        },
        10 * 60 * 1000,
      );
    }, [stopPolling, api, handleSignOut]);

    useEffect(() => {
      if (!session) {
        stopPolling();
      }

      return () => {
        stopPolling();
      };
    }, [stopPolling, session]);

    function handleRemoveFromCart(item: InventoryItem) {
      removeFromCart(item);
    }

    return (
      <Drawer direction="right" open={cartOpen} onOpenChange={setCartOpen}>
        <DrawerContent
          aria-describedby="cart-drawer"
          className="md:min-w-lg max-w-full h-full bg-gray-800 shadow-lg p-4 flex flex-col"
        >
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
              form.handleSubmit();
            }}
          >
            <div className="mb-4 flex flex-col gap-2">
              <form.Field
                name="gameName"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "Game name is required";
                    if (value.length > 15)
                      return "Game name must be 15 characters or less";
                    if (!/^[a-zA-Z0-9-_]*$/.test(value))
                      return "Game name can only contain letters and numbers";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div>
                    <Input
                      type="text"
                      autoComplete="off"
                      className="p-2 rounded bg-gray-900 border border-gray-700 text-white"
                      placeholder="Game Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      maxLength={15}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="gamePass"
                validators={{
                  onChange: ({ value }) => {
                    if (value.length > 15)
                      return "Password must be 15 characters or less";
                    if (value && !/^[a-zA-Z0-9]*$/.test(value))
                      return "Password can only contain letters and numbers";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="off"
                      className="p-2 rounded bg-gray-900 border border-gray-700 text-white pr-10"
                      placeholder="Game Password (optional)"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      maxLength={15}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1.5 text-gray-400 hover:text-white"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex-1 overflow-hidden">
              {cart.length === 0 ? (
                <div className="text-gray-400">No items in drop list.</div>
              ) : (
                <div className="h-full flex flex-col gap-y-2">
                  <FixedSizeList
                    height={
                      typeof window !== "undefined"
                        ? window.innerHeight - 250
                        : 400
                    }
                    itemCount={cart.length}
                    itemSize={120}
                    width="100%"
                    itemData={{ cart, handleRemoveFromCart }}
                    overscanCount={6}
                  >
                    {CartItemRow}
                  </FixedSizeList>
                </div>
              )}
            </div>

            <DrawerFooter className="mt-4 p-0">
              <form.Subscribe
                selector={(state) => [
                  state.canSubmit,
                  state.isSubmitting,
                  cart.length,
                ]}
              >
                {([canSubmit, isSubmitting, cartLength]) => (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white rounded p-2 font-semibold disabled:opacity-50"
                    disabled={
                      !!(!canSubmit || cartLength === 0 || isSubmitting)
                    }
                    type="submit"
                  >
                    {isSubmitting ? "Processing..." : "Drop Items"}
                  </button>
                )}
              </form.Subscribe>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    );
  },
);
