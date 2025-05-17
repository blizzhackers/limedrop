import { Input } from "@/components/ui/input";
import type { D2BotAPI } from "@/lib/D2Bot";
import { FieldInfo } from "@/lib/util";
import { mapApiItemToInventoryItem } from "@/lib/utils";
import {
  setApiUrl,
  setCartOpen,
  setInventory,
  setLoadingInventory,
  setPassword,
  setRecentDropsOpen,
  setSearchResults,
  setSearchTerm,
  setUsername,
  useAppStore,
} from "@/stores/useAppStore";
import { useForm } from "@tanstack/react-form";
import { ChevronDown, CircleUser, History, Search, ShoppingCart, X } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import { toast } from "sonner";

interface TopbarProps {
  session: string | null;
  handleSignOut: () => void;
  api: D2BotAPI;
  setSession: (value: React.SetStateAction<string | null>) => void;
  fetchAccounts: (session: string) => Promise<void>;
}

export const Topbar: React.FC<TopbarProps> = memo(
  ({ api, session, handleSignOut, setSession, fetchAccounts }) => {
    const searchValid = useAppStore((s) => !s.searchTerm);
    const apiUrl = useAppStore((s) => s.apiUrl);
    const username = useAppStore((s) => s.username);
    const searchTerm = useAppStore((s) => s.searchTerm);
    const password = useAppStore((s) => s.password);
    const cart = useAppStore((s) => s.cart);

    const [loginOpen, setLoginOpen] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    const form = useForm({
      defaultValues: {
        apiUrl: apiUrl,
        username: username,
        password: password,
      },
      onSubmit: async ({ value }) => {
        try {
          const session = await api.login(value.username, value.password, value.apiUrl);
          setSession(session || null);
          setLoginOpen(false);
          
          setApiUrl(value.apiUrl);
          setUsername(value.username);
          setPassword(value.password);
          
          toast.success("Login successful!", {
            description: "Welcome to LimeDrop!",
          });
          await fetchAccounts(session);
        } catch (err: unknown) {
          setLoginError((err as Error).message || "Login failed");
        }
      },
    });

    useEffect(() => {
      if (!searchValid) {
        React.startTransition(() => {
          setSearchResults([]);
        });
      }
    }, [searchValid]);

    const openCart = () => {
      setCartOpen(true);
    };

    async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const searchTerm = formData.get("searchTerm");

      if (typeof searchTerm !== "string" || !searchTerm) {
        setSearchTerm("");
        setSearchResults([]);
        return;
      }
      try {
        const { selectedAccount, selectedCharacter, realm } =
          useAppStore.getState();
        setLoadingInventory(true);
        setSearchTerm(searchTerm);

        const acc = selectedAccount === "Show All" ? "" : selectedAccount;
        const char = selectedCharacter === "Show All" ? "" : selectedCharacter;
        const response = await api.query(
          searchTerm.toLocaleLowerCase(),
          realm,
          acc,
          char,
        );
        if (Array.isArray(response)) {
          const items = response.map((el) =>
            mapApiItemToInventoryItem(el, realm),
          );
          const prevInvo = useAppStore.getState().inventory;
          const existingIds = new Set(prevInvo.map((i) => i.itemid));
          const newItems = items.filter((i) => !existingIds.has(i.itemid));
          if (newItems.length > 0) {
            setInventory(prevInvo.concat(newItems));
          }
          setSearchResults(items);
        }
      } catch (err) {
        toast.error("Search failed", { description: String(err) });
      } finally {
        setLoadingInventory(false);
      }
    }

    return (
      <header className="flex items-center justify-between px-2 md:px-4 py-2 bg-gray-800 shadow relative">
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 pl-12 md:pl-0">
          <b className="logo-icon hidden md:block">
            <img src="/logo-icon.png" alt="homepage" className="h-8 w-8 md:h-auto md:w-auto" />
          </b>
          <span className="logo-text hidden md:block">
            <img src="/logo-text.png" alt="homepage" className="light-logo" />
          </span>
          <span className="logo-text md:hidden">
            <img src="/logo-text.png" alt="homepage" className="light-logo h-6 w-24 object-scale-down" />
          </span>
        </div>

        {session && !showMobileSearch && (
          <form className="relative hidden md:block ml-6 w-64" onSubmit={handleSearch}>
            <Input
              id="searchTerm"
              name="searchTerm"
              type="text"
              className="w-full p-2 pl-9 rounded bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Search & enter"
              onChange={(e) => e.target.value === "" && searchTerm && setSearchTerm("")}
            />
            <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
          </form>
        )}

        {showMobileSearch && (
          <div className="absolute inset-0 z-50 bg-gray-800 px-2 py-2 flex items-center md:hidden">
            <form className="flex-1 relative" onSubmit={handleSearch}>
              <Input
                id="searchTerm"
                name="searchTerm"
                type="text"
                className="w-full p-2 pl-9 rounded bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Search & enter"
                autoFocus
                onChange={(e) => e.target.value === "" && searchTerm && setSearchTerm("")}
              />
              <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </span>
            </form>
            <button
              type="button"
              className="ml-2 p-2 hover:bg-gray-700 rounded"
              onClick={() => setShowMobileSearch(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-4">
          {session && (
            <>
              <button
                type="button"
                className="md:hidden p-2 hover:bg-gray-700 rounded"
                onClick={() => setShowMobileSearch(true)}
              >
                <Search className="w-6 h-6 text-lime-400" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-700 rounded"
                onClick={() => setRecentDropsOpen(true)}
                title="Show Recent Drops"
              >
                <History className="w-6 h-6 text-lime-400" />
              </button>
            </>
          )}
          <button
            type="button"
            className="relative p-2 hover:bg-gray-700 rounded"
            onClick={openCart}
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-xs rounded-full px-2">
                {cart.length}
              </span>
            )}
          </button>
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-1 md:gap-2 p-2 hover:bg-gray-700 rounded"
              onClick={() => setLoginOpen(!loginOpen)}
            >
              <CircleUser className="h-8 w-8 rounded-full" />
              <span className="hidden md:inline">{session ? username : "User"}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {loginOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
                {session ? (
                  <div className="flex flex-col gap-2 p-4">
                    <div className="text-green-400 mb-2">
                      Logged in as {username}
                    </div>
                    <button
                      type="button"
                      className="bg-red-600 hover:bg-red-700 text-white rounded p-2 font-semibold"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <form
            className="flex flex-col gap-2 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="apiUrl"
              validators={{
                onChange: ({ value }) => !value ? "API URL is required" : undefined,
              }}
            >
              {(field) => (
                <div>
                  <input
                    className="p-2 rounded bg-gray-900 border border-gray-700 w-full text-white"
                    placeholder="API URL"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            
            <form.Field
              name="username"
              validators={{
                onChange: ({ value }) => !value ? "Username is required" : undefined,
              }}
            >
              {(field) => (
                <div>
                  <input
                    className="p-2 rounded bg-gray-900 border border-gray-700 w-full text-white"
                    placeholder="Username"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => !value ? "Password is required" : undefined,
              }}
            >
              {(field) => (
                <div>
                  <input
                    className="p-2 rounded bg-gray-900 border border-gray-700 w-full text-white"
                    type="password"
                    placeholder="Password"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            
            {loginError && (
              <div className="text-red-400 text-sm">{loginError}</div>
            )}
            
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white rounded p-2 font-semibold disabled:opacity-50"
                  disabled={!canSubmit}
                >
                  {isSubmitting ? "Logging in..." : "Login"}
                </button>
              )}
            </form.Subscribe>
          </form>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  },
);
