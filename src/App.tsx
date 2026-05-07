import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import "./App.css";
import { toast } from "sonner";
import { shallow } from "zustand/shallow";
import { CartDrawer } from "@/components/CartDrawer";
import { DebugButton } from "@/components/DebugButton";
import { InventoryGrid } from "@/components/InventoryGrid";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useInventoryWorker } from "@/hooks/useInventoryWorker";
import { D2BotAPI } from "@/lib/D2Bot";
import { type InventoryItem, naturalSort } from "@/lib/utils";
import {
  type AccountDataCache,
  setAccountDataCache,
  setAccounts,
  setFullyLoaded,
  setInventory,
  setLoadingInventory,
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

  const [, startTransition] = useTransition();
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsToLoad, setAccountsToLoad] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const [api] = useState(() => {
    const apiInstance = new D2BotAPI();
    apiInstance.config.host = apiUrl;
    apiInstance.config.username = username;

    return apiInstance;
  });

  const handleSignOut = useCallback(() => {
    workerRef.current?.terminate();
    setAccountsToLoad([]);
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
      selectedAccount: "Show All",
      selectedCharacter: "Show All",
      session: null,
      showDebugInfo: false,
    });

    toast.success("Signed out successfully!");
  }, []);

  const fetchAccounts = useCallback(
    async (session: string) => {
      if (!session) {
        console.warn("No session established");
        return;
      }

      try {
        setLoadingAccounts(true);
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
            return;
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

            if (realmKey !== realm) {
              continue;
            }

            if (!accountsMap[accountName]) {
              accountsMap[accountName] = [];
            }

            // Check if character matches current filters
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
            continue;
          }
        }

        setAccounts(accountsMap);
        setAccountDataCache(accountsCache);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      } finally {
        setLoadingAccounts(false);
      }
    },
    [api, handleSignOut],
  );

  const resetAccountLoading = useCallback(() => {
    const { selectedAccount, accounts } = useAppStore.getState();

    if (selectedAccount === "Show All") {
      const accs = Object.keys(accounts).sort(naturalSort);
      setAccountsToLoad(accs);
    } else {
      setAccountsToLoad([selectedAccount]);
    }
  }, []);

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

  useEffect(() => {
    const accountsToLoadSub = useAppStore.subscribe(
      (s) => [
        s.gameType,
        s.gameMode,
        s.gameClass,
        s.realm,
        s.selectedAccount,
        s.accountDataCache,
      ],
      ([
        gameType,
        gameMode,
        gameClass,
        realm,
        selectedAccount,
        accountDataCache,
      ]) => {
        if (typeof accountDataCache === "string") return;

        const checks = {
          ladder: gameClass === "Ladder",
          lod: gameType === "Expansion",
          sc: gameMode === "Softcore",
        };

        const validAccounts = accountDataCache
          .filter(
            (el) =>
              el.lod === checks.lod &&
              el.sc === checks.sc &&
              el.ladder === checks.ladder &&
              el.realm === realm &&
              (selectedAccount === "Show All" ||
                selectedAccount === el.accountName),
          )
          .map((el) => el.accountName)
          .sort(naturalSort);
        const accountSet = new Set(validAccounts);
        workerRef.current?.terminate();

        console.log("Determining accounts to load...", validAccounts);

        const { selectedCharacter, inventoryCache } = useAppStore.getState();
        const cachedItems: InventoryItem[] = [];
        const currentFilters = {
          gameType,
          gameMode,
          gameClass,
          realm,
          selectedCharacter,
        };

        for (const account of accountSet) {
          const cacheKey = `${account}:${realm}`;
          const cached = inventoryCache[cacheKey];

          const isCacheValid =
            cached &&
            Date.now() - cached.timestamp < 5 * 60 * 1000 &&
            JSON.stringify(cached.filters) === JSON.stringify(currentFilters);

          if (isCacheValid) {
            console.log(`Using cached data for ${account}`);
            accountSet.delete(account);
            cachedItems.push(...cached.items);
          } else {
            console.log(`Need to load data for ${account}`);
          }
        }

        if (cachedItems.length > 0) {
          startTransition(() => {
            setInventory(cachedItems);
          });
          setLoadingInventory(false);

          if (accountSet.size === 0) {
            setFullyLoaded(true);
            return;
          }
        } else {
          setLoadingInventory(true);
          setInventory([]);
        }

        setFullyLoaded(false);
        setAccountsToLoad(Array.from(accountSet));
      },
      { equalityFn: shallow },
    );

    return () => {
      accountsToLoadSub();
    };
  }, []);

  useInventoryWorker({ api, accountsToLoad, session, apiUrl, workerRef });

  return (
    <div
      className="w-screen h-screen min-h-0 min-w-0 bg-gray-900 text-white flex flex-col overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
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
        <main className="flex-1 min-h-0 min-w-0 p-2 bg-gray-900 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full min-h-0 min-w-0">
            <section className="md:col-span-3 bg-gray-800 rounded shadow p-2 md:p-4 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
              <InventoryGrid
                api={api}
                fetchAccounts={fetchAccounts}
                session={session}
                fetchInventory={async () => {
                  resetAccountLoading();
                }}
                loadingAccounts={loadingAccounts}
              />
            </section>
          </div>
        </main>
      </div>
      <CartDrawer api={api} />

      <DebugButton />

      <footer className="text-center py-1 text-xs md:text-base md:py-4 text-gray-400 bg-gray-800 mt-auto w-full">
        &copy; 2025 Lime Drop. All rights reserved.
      </footer>
    </div>
  );
}
