import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/useAppStore";
import { ChevronDown, CircleUser, History, ShoppingCart } from "lucide-react";
import type React from "react";

interface TopbarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onSearch?: (e: React.FormEvent<HTMLFormElement>) => void;
  onCartOpen: () => void;
  session: string | null;
  username: string;
  loginOpen: boolean;
  setLoginOpen: (v: boolean) => void;
  handleSignOut: () => void;
  handleLogin: (e: React.FormEvent) => void;
  apiUrl: string;
  setApiUrl: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loginError: string | null;
  setUsername: (v: string) => void;
  onShowRecentDrops?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  onCartOpen,
  session,
  username,
  loginOpen,
  setLoginOpen,
  handleSignOut,
  handleLogin,
  apiUrl,
  setApiUrl,
  password,
  setPassword,
  loginError,
  setUsername,
  onShowRecentDrops,
}) => {
  const cart = useAppStore((s) => s.cart);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-800 shadow">
      <div className="flex items-center gap-4 flex-shrink-0">
        <b className="logo-icon p-l-10">
          <img src="/logo-icon.png" alt="homepage" className="light-logo" />
        </b>
        <span className="logo-text">
          <img src="/logo-text.png" alt="homepage" className="light-logo" />
        </span>
        {session && (
          <form className="relative ml-6 w-64" onSubmit={onSearch}>
            <Input
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
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>
          </form>
        )}
      </div>
      <div className="flex items-center gap-4 flex-1 justify-end">
        <button
          className="relative p-2 hover:bg-gray-700 rounded"
          onClick={onCartOpen}
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-600 text-xs rounded-full px-2">
              {cart.length}
            </span>
          )}
        </button>
        {onShowRecentDrops && (
          <button
            className="relative p-2 hover:bg-gray-700 rounded"
            onClick={onShowRecentDrops}
            title="Show Recent Drops"
          >
            <History className="w-6 h-6 text-lime-400" />
          </button>
        )}
        <div className="relative">
          <button
            className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded"
            onClick={() => setLoginOpen(!loginOpen)}
          >
            <CircleUser className="h-8 w-8 rounded-full" />
            <span>{session ? username : "User"}</span>
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
                    className="bg-red-600 hover:bg-red-700 text-white rounded p-2 font-semibold"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-2 p-4"
                  onSubmit={handleLogin}
                >
                  <input
                    className="p-2 rounded bg-gray-900 border border-gray-700"
                    placeholder="API URL"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <input
                    className="p-2 rounded bg-gray-900 border border-gray-700"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <input
                    className="p-2 rounded bg-gray-900 border border-gray-700"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {loginError && (
                    <div className="text-red-400 text-sm">{loginError}</div>
                  )}
                  <button className="mt-2 bg-green-600 hover:bg-green-700 text-white rounded p-2 font-semibold">
                    Login
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
