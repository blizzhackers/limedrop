import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import "./App.css";
import { toast } from "sonner";
import { CartDrawer } from "@/components/CartDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { DebugButton } from "@/components/DebugButton";
import { DemoBanner } from "@/components/DemoBanner";
import { DevScreenDialog } from "@/components/Dev";
import { InventoryGrid } from "@/components/InventoryGrid";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useAccountsToLoad } from "@/hooks/useAccountsToLoad";
import { useInventoryWorker } from "@/hooks/useInventoryWorker";
import { D2BotAPI } from "@/lib/D2Bot";
import { naturalSort } from "@/lib/utils";
import {
  type AccountDataCache,
  setAccountDataCache,
  setAccounts,
  setLoginOpen,
  useAppStore,
} from "@/stores/appStore";

declare global {
  interface Window {
    sessionFailCount?: number;
  }
}

export default function App() {
  const apiUrl = useAppStore((s) => s.apiUrl);
  const username = useAppStore((s) => s.username);
  const session = useAppStore((s) => s.session);

  const [loadingAccounts, startAccountsTransition] = useTransition();
  const workerRef = useRef<Worker | null>(null);

  const { accountsToLoad, resetAccountLoading } = useAccountsToLoad({
    workerRef,
  });

  const [api] = useState(() => {
    const apiInstance = new D2BotAPI();
    apiInstance.config.host = apiUrl;
    apiInstance.config.username = username;

    return apiInstance;
  });

  const handleSignOut = useCallback(() => {
    workerRef.current?.terminate();
    setLoginOpen(false);

    if (useAppStore.getState().username === "demo") {
      useAppStore.setState({
        apiUrl: import.meta.env.VITE_API_URL || "http://localhost:8080",
        username: "test",
      });
    }

    useAppStore.setState({
      password: "",
      accounts: {},
      accountDataCache: [],
      inventory: [],
      cart: [],
      cartItemIds: new Set(),
      selectedAccount: "Show All",
      selectedCharacter: "Show All",
      session: null,
      showDebugInfo: false,
    });

    toast.success("Signed out successfully!");
  }, []);

  const fetchAccounts = useCallback(
    (session: string) => {
      if (!session) {
        console.warn("No session established");
        return;
      }

      startAccountsTransition(async () => {
        const response = await api.accounts();

        if (response.status === "failed") {
          console.error("Failed to fetch accounts:", response.body);

          if (response.body === "invalid session") {
            console.error(
              "Invalid session detected, session needs to be refreshed",
            );
            handleSignOut();
            toast.error("Session Error", {
              description: "Your session has expired, please log in again",
            });
          }
          return;
        }

        const { body: accountsData } = response;

        if (!Array.isArray(accountsData)) {
          console.error("Unexpected accounts data format:", accountsData);
          return;
        }

        accountsData.sort(naturalSort);
        const accountsCache: AccountDataCache[] = [];
        const accountsMap: Record<string, string[]> = {};
        const { gameClass, gameMode, gameType, realm } = useAppStore.getState();

        for (const account of accountsData) {
          try {
            const res = account.split("\\");
            if (!res || res.length < 3) continue;

            const [realmKey, accountName, charName] = res;
            const charkey = charName.split(".")[1];

            if (realmKey !== realm) continue;

            if (!accountsMap[accountName]) {
              accountsMap[accountName] = [];
            }

            const charCheck = {
              ladder: charkey[2] === "l",
              lod: charkey[1] === "e",
              sc: charkey[0] === "s",
            };

            const checks = {
              ladder: gameClass === "Ladder",
              lod: gameType === "Expansion",
              sc: gameMode === "Softcore",
            };

            if (
              charCheck.ladder === checks.ladder &&
              charCheck.lod === checks.lod &&
              charCheck.sc === checks.sc
            ) {
              accountsMap[accountName].push(charName);
            }

            accountsCache.push({
              realm,
              accountName,
              charName,
              ladder: charCheck.ladder,
              sc: charCheck.sc,
              lod: charCheck.lod,
            });
          } catch (err) {
            console.error("Error processing account:", account, err);
          }
        }

        setAccounts(accountsMap);
        setAccountDataCache(accountsCache);
      });
    },
    [api, handleSignOut],
  );

  useEffect(() => {
    const pingApi = async () => {
      try {
        const res = await api.PING();
        console.log(JSON.stringify(res, null, 2));
        console.log("API is reachable");
      } catch (err) {
        console.error("API is unreachable:", err);
      }
    };
    pingApi();

    toast.success("Notification", { description: "Welcome to Lime Drop!" });
  }, [api]);

  // On mount, if we already have a persisted session, fetch accounts to
  // bootstrap the subscriber (which only fires on state *changes*, not
  // on initial load from persisted Zustand state).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    if (session) {
      fetchAccounts(session);
    }
  }, []);

  useInventoryWorker({ api, accountsToLoad, session, apiUrl, workerRef });

  return (
    <div
      className="w-screen h-screen min-h-0 min-w-0 bg-gray-900 text-white flex flex-col overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      <DemoBanner />
      <Topbar
        api={api}
        handleSignOut={handleSignOut}
        fetchAccounts={fetchAccounts}
      />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <Sidebar
          session={session}
          loadingAccounts={loadingAccounts}
          fetchAccounts={fetchAccounts}
        />
        <main className="flex-1 min-h-0 min-w-0 p-2 bg-gray-900 overflow-hidden flex flex-col">
          <InventoryGrid
            api={api}
            fetchAccounts={fetchAccounts}
            session={session}
            fetchInventory={async () => {
              resetAccountLoading();
            }}
            loadingAccounts={loadingAccounts}
          />
        </main>
      </div>
      <CartDrawer api={api} />

      <DevScreenDialog api={api} />

      <CommandPalette onSignOut={handleSignOut} />

      <DebugButton />

      <footer className="text-center py-1 text-xs md:text-base md:py-4 text-gray-400 bg-gray-800 mt-auto w-full">
        &copy; {new Date().getFullYear()} Lime Drop. All rights reserved.
      </footer>
    </div>
  );
}
