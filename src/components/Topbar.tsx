import { useForm } from "@tanstack/react-form";
import {
  ChevronDown,
  CircleUser,
  History,
  PackagePlus,
  Search,
  ShoppingCart,
  SwitchCamera,
  X,
} from "lucide-react";
import React, { memo, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { D2BotAPI } from "@/lib/D2Bot";
import { FieldInfo } from "@/lib/util";
import { mapApiItemToInventoryItem } from "@/lib/utils";
import {
  setApiUrl,
  setCartOpen,
  setInventory,
  setLoadingInventory,
  setLoginOpen,
  setPassword,
  setRecentDropsOpen,
  setSearchResults,
  setSearchTerm,
  setSession,
  setUsername,
  useAppStore,
} from "@/stores/appStore";
import { useConvertNLDialogStore } from "@/stores/convertNLDialogStore";
import { useItemPacksDialogStore } from "@/stores/itemPacksDialogStore";
import { ConvertNLDialog } from "./ConvertNLDialog";
import { DevScreen } from "./Dev";

interface TopbarProps {
  api: D2BotAPI;
  handleSignOut: () => void;
  fetchAccounts: (session: string) => Promise<void>;
}

export const Topbar: React.FC<TopbarProps> = memo(
  ({ api, handleSignOut, fetchAccounts }) => {
    const searchValid = useAppStore((s) => !s.searchTerm);
    const apiUrl = useAppStore((s) => s.apiUrl);
    const username = useAppStore((s) => s.username);
    const searchTerm = useAppStore((s) => s.searchTerm);
    const password = useAppStore((s) => s.password);
    const cart = useAppStore((s) => s.cart);
    const session = useAppStore((s) => s.session);
    const loginOpen = useAppStore((s) => s.loginOpen);

    const [loginError, setLoginError] = useState<string | null>(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showDevScreen, setShowDevScreen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
      defaultValues: {
        apiUrl: apiUrl,
        username: username,
        password: password,
      },
      onSubmit: async ({ value }) => {
        try {
          const session = await api.login(
            value.username,
            value.password,
            value.apiUrl,
          );

          const validate = await api.validate(value.username, session);
          if (!validate) {
            throw new Error("Failed to validate session");
          }
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

    const [, startTransition] = useTransition();

    useEffect(() => {
      if (inputRef.current && useAppStore.getState().searchTerm !== "") {
        inputRef.current.value = useAppStore.getState().searchTerm;
      }
    }, []);

    useEffect(() => {
      if (!searchValid) {
        startTransition(() => {
          setSearchResults([]);
        });
      }
    }, [searchValid]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          loginOpen &&
          dropdownRef.current &&
          buttonRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setLoginOpen(false);
        }
      }

      if (loginOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [loginOpen]);

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
      <>
        <ConvertNLDialog api={api} />
        <header className="flex items-center justify-between px-3 md:px-4 py-2 bg-gray-800 shadow relative">
          <div className="flex items-center gap-2 flex-shrink-0 pl-12 md:pl-0">
            <b className="logo-icon hidden md:block">
              <img
                src="/logo-icon.png"
                alt="homepage"
                className="h-8 w-8 md:h-auto md:w-auto"
              />
            </b>
            <span className="logo-text hidden md:block">
              <img src="/logo-text.png" alt="homepage" className="light-logo" />
            </span>
            <span className="logo-text md:hidden">
              <img
                src="/logo-text.png"
                alt="homepage"
                className="light-logo h-5 w-20 object-scale-down"
              />
            </span>
          </div>

          {session && !showMobileSearch && (
            <form
              className="relative hidden md:block ml-1 max-w-lg xl:max-w-4xl w-full"
              onSubmit={handleSearch}
            >
              <Input
                ref={inputRef}
                id="searchTerm"
                name="searchTerm"
                type="text"
                className="w-full p-2 pl-9 rounded bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Search & enter"
                onChange={(e) =>
                  e.target.value === "" && searchTerm && setSearchTerm("")
                }
              />
              <span className="absolute left-2 top-2.5 text-gray-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </span>
            </form>
          )}

          {showMobileSearch && (
            <div className="absolute inset-0 z-50 bg-gray-800 px-3 py-2 flex items-center md:hidden">
              <form className="flex-1 relative" onSubmit={handleSearch}>
                <Input
                  id="searchTerm"
                  name="searchTerm"
                  type="text"
                  className="w-full p-3 pl-10 rounded bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Search & enter"
                  autoFocus
                  onChange={(e) =>
                    e.target.value === "" && searchTerm && setSearchTerm("")
                  }
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Search className="w-5 h-5" />
                </span>
              </form>
              <button
                type="button"
                className="ml-3 p-2 hover:bg-gray-700 rounded-full"
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
                  className="md:hidden p-2.5 hover:bg-gray-700 rounded-full transition-colors"
                  onClick={() => setShowMobileSearch(true)}
                >
                  <Search className="w-5 h-5 text-lime-400" />
                </button>
                <button
                  type="button"
                  className="p-2 md:p-2.5 hover:bg-gray-700 rounded-full transition-colors"
                  onClick={() => setRecentDropsOpen(true)}
                  title="Show Recent Drops"
                >
                  <History className="w-5 h-5 md:w-6 md:h-6 text-lime-400" />
                </button>
                <button
                  type="button"
                  className="p-2 md:p-2.5 hover:bg-gray-700 rounded-full transition-colors"
                  onClick={() =>
                    useItemPacksDialogStore.getState().setOpen(true)
                  }
                  title="Manage Item Packs"
                >
                  <PackagePlus className="w-5 h-5 md:w-6 md:h-6 text-lime-400" />
                </button>
              </>
            )}
            <button
              type="button"
              className="relative p-2 md:p-2.5 hover:bg-gray-700 rounded-full transition-colors"
              onClick={openCart}
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-tight">
                  {cart.length}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                className="flex items-center gap-1 md:gap-2 p-2 md:p-2.5 hover:bg-gray-700 rounded-full transition-colors"
                onClick={() => setLoginOpen(!loginOpen)}
              >
                <CircleUser className="h-7 w-7 md:h-8 md:w-8 rounded-full" />
                <span className="hidden md:inline">
                  {session ? username : "User"}
                </span>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
              </button>

              {loginOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-72 md:w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-[80vh] overflow-y-auto"
                >
                  {session ? (
                    <div className="flex flex-col gap-3 p-4">
                      <div className="text-green-400 mb-1 text-sm">
                        Logged in as{" "}
                        <span className="font-medium">{username}</span>
                      </div>
                      <button
                        type="button"
                        className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-3 font-medium flex items-center justify-center gap-2 transition-colors"
                        onClick={() =>
                          useConvertNLDialogStore.getState().setOpen(true)
                        }
                      >
                        <SwitchCamera className="w-4 h-4" />
                        Convert Ladder to NL
                      </button>
                      {process.env.NODE_ENV === "development" && (
                        <button
                          type="button"
                          onClick={() => setShowDevScreen(!showDevScreen)}
                          className="fixed bottom-4 left-4 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded z-50"
                        >
                          {showDevScreen ? "Hide Dev" : "Show Dev"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 font-medium transition-colors"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <form
                      className="flex flex-col gap-3 p-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                      }}
                    >
                      <form.Field
                        name="apiUrl"
                        validators={{
                          onChange: ({ value }) =>
                            !value ? "API URL is required" : undefined,
                        }}
                      >
                        {(field) => (
                          <div>
                            <input
                              className="p-3 rounded-lg bg-gray-900 border border-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                              placeholder="API URL"
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>

                      <form.Field
                        name="username"
                        validators={{
                          onChange: ({ value }) =>
                            !value ? "Username is required" : undefined,
                        }}
                      >
                        {(field) => (
                          <div>
                            <input
                              autoFocus
                              autoComplete="off"
                              className="p-3 rounded-lg bg-gray-900 border border-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                              placeholder="Username"
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>

                      <form.Field
                        name="password"
                        validators={{
                          onChange: ({ value }) =>
                            !value ? "Password is required" : undefined,
                        }}
                      >
                        {(field) => (
                          <div>
                            <input
                              className="p-3 rounded-lg bg-gray-900 border border-gray-700 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                              type="password"
                              placeholder="Password"
                              autoComplete="off"
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            <FieldInfo field={field} />
                          </div>
                        )}
                      </form.Field>

                      {loginError && (
                        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-2">
                          {loginError}
                        </div>
                      )}

                      <form.Subscribe
                        selector={(state) => [
                          state.canSubmit,
                          state.isSubmitting,
                        ]}
                      >
                        {([canSubmit, isSubmitting]) => (
                          <button
                            type="submit"
                            className="mt-1 bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 font-medium disabled:opacity-50 transition-colors"
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

        {showDevScreen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
            <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-4xl max-h-[80vh] overflow-auto relative">
              <button
                type="button"
                onClick={() => setShowDevScreen(false)}
                className="absolute top-2 right-2 p-2 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
              <DevScreen api={api} />
            </div>
          </div>
        )}
      </>
    );
  },
);
