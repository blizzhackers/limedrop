import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { CartDrawer } from "@/components/CartDrawer";
import { InventoryGrid } from "@/components/InventoryGrid";
import { RecentDrops } from "@/components/RecentDrops";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { D2BotAPI } from "@/lib/D2Bot";
import {
  type InventoryItem,
  appendUniqueItems,
  naturalSort,
} from "@/lib/utils";
import {
  type AccountDataCache,
  setAccountDataCache,
  setAccounts,
  setFullyLoaded,
  setInventory,
  setLoadingInventory,
  useAppStore,
} from "@/stores/useAppStore";
import { useCallback } from "react";
import { toast } from "sonner";
import { shallow } from "zustand/shallow";

declare global {
  interface Window {
    sessionFailCount?: number;
  }
}

export default function App() {
  const apiUrl = useAppStore((s) => s.apiUrl);
  const username = useAppStore((s) => s.username);

  const [session, setSession] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingCounterRef = useRef<number>(0);
  const [accountsToLoad, setAccountsToLoad] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const [api] = useState(() => {
    const apiInstance = new D2BotAPI();
    apiInstance.config.host = apiUrl;
    apiInstance.config.username = username;

    return apiInstance;
  });

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingCounterRef.current = 0;
  }, []);

  const handleSignOut = useCallback(() => {
    workerRef.current?.terminate();
    setSession(null);
    setAccountsToLoad([]);
    useAppStore.setState({
      password: "",
      accounts: {},
      accountDataCache: [],
      inventory: [],
      cart: [],
      selectedAccount: "Show All",
      selectedCharacter: "Show All",
    });
    toast.success("Signed out successfully!");

    // Stop polling when signed out
    stopPolling();
  }, [stopPolling]);

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
                  console.error("Error parsing message:", parseError, message);
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
  }, [stopPolling, api, handleSignOut]);

  async function fetchAccounts(session: string) {
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
      }

      setAccounts(accountsMap);
      setAccountDataCache(accountsCache);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }

  function resetAccountLoading() {
    const { selectedAccount, accounts } = useAppStore.getState();

    if (selectedAccount === "Show All") {
      const accs = Object.keys(accounts).sort(naturalSort);
      setAccountsToLoad(accs);
    } else {
      setAccountsToLoad([selectedAccount]);
    }
  }

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

    return () => {
      stopPolling();
    };
  }, [api, stopPolling]);

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
          React.startTransition(() => {
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

  useEffect(() => {
    if (session) {
      startPolling();
    } else {
      handleSignOut();
    }
  }, [session, startPolling, handleSignOut]);

  useEffect(() => {
    if (!session || accountsToLoad.length === 0) {
      setLoadingInventory(false);
      setFullyLoaded(true);
      return;
    }

    (async () => {
      if (workerRef.current) {
        workerRef.current?.terminate();
      }

      const worker = new Worker(
        new URL("./workers/inventoryWorker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.type === "account-items") {
          console.log(msg);

          const { selectedCharacter, realm, gameType, gameMode, gameClass } =
            useAppStore.getState();

          const currentFilters = {
            gameType,
            gameMode,
            gameClass,
            realm,
            selectedCharacter,
          };

          if (msg.items.length > 0) {
            // Group items by account
            const itemsByAccount = msg.items.reduce(
              (acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
                if (!acc[item.account]) {
                  acc[item.account] = [];
                }
                acc[item.account].push(item);
                return acc;
              },
              {},
            );

            Object.entries(itemsByAccount).forEach(([account, items]) => {
              useAppStore.setState((state) => {
                const cacheKey = `${account}:${realm}`;
                return {
                  inventoryCache: {
                    ...state.inventoryCache,
                    [cacheKey]: {
                      items: items as InventoryItem[],
                      timestamp: Date.now(),
                      filters: currentFilters,
                    },
                  },
                };
              });
            });
          }

          const prevInvo = useAppStore.getState().inventory;
          const newInvo = appendUniqueItems(prevInvo, msg.items);
          React.startTransition(() => {
            setInventory(newInvo);
          });

          if (prevInvo.length === 0) {
            setLoadingInventory(false);
          }
        } else if (msg.type === "done") {
          console.log(msg);
          setLoadingInventory(false);
          setFullyLoaded(true);
        } else if (msg.type === "error") {
          console.error(msg);
        } else if (msg.type === "started") {
          setFullyLoaded(false);
        }
      };

      const {
        accounts,
        selectedCharacter,
        realm,
        gameClass,
        gameType,
        gameMode,
        username,
        password,
      } = useAppStore.getState();

      worker.postMessage({
        type: "load-accounts",
        session: api.config.session,
        accounts: accountsToLoad,
        accountsMap: accounts,
        selectedCharacter,
        realm,
        gameClass,
        gameType,
        gameMode,
        apiUrl,
        username,
        password,
      });
    })();
  }, [api, accountsToLoad, session, apiUrl]);

  return (
    <div
      className="w-screen h-screen min-h-0 min-w-0 bg-gray-900 text-white flex flex-col overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      <Topbar
        api={api}
        session={session}
        handleSignOut={handleSignOut}
        setSession={setSession}
        startPolling={startPolling}
        fetchAccounts={fetchAccounts}
      />

      <RecentDrops session={session} />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <Sidebar
          session={session}
          loadingAccounts={loadingAccounts}
          fetchAccounts={fetchAccounts}
        />
        <main className="flex-1 min-h-0 min-w-0 p-2 bg-gray-900 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full min-h-0 min-w-0">
            <section className="md:col-span-3 bg-gray-800 rounded shadow p-4 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
              <InventoryGrid
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
      <footer className="text-center py-4 text-gray-400 bg-gray-800 mt-auto w-full">
        &copy; 2025 Lime Drop. All rights reserved.
      </footer>
    </div>
  );
}
