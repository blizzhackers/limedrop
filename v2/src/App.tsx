import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { CartDrawer } from "@/components/CartDrawer";
import { InventoryGrid } from "@/components/InventoryGrid";
import { RecentDrops } from "@/components/RecentDrops";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { type ApiItemResponse, type ApiResponse, D2BotAPI } from "@/lib/D2Bot";
import { type InventoryItem, deepEqual, extractItemInfo } from "@/lib/utils";
import {
  clearCart,
  setApiUrl,
  setPassword,
  useAppStore,
} from "@/stores/useAppStore";
import { toast } from "sonner";

declare global {
  interface Window {
    sessionFailCount?: number;
  }
}

const MIN_ITEM_COUNT = 100;

export default function App() {
  const realm = useAppStore((s) => s.realm);
  const gameType = useAppStore((s) => s.gameType);
  const gameMode = useAppStore((s) => s.gameMode);
  const gameClass = useAppStore((s) => s.gameClass);
  const apiUrl = useAppStore((s) => s.apiUrl);
  const username = useAppStore((s) => s.username);

  const [searchTerm, setSearchTerm] = useState("");
  const [session, setSession] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<Record<string, string[]>>({});
  const [selectedAccount, setSelectedAccount] = useState<string>("Show All");
  const [selectedCharacter, setSelectedCharacter] =
    useState<string>("Show All");
  const [qualityFilter, setQualityFilter] = useState<number | null>(null);
  const fullInventoryRef = useRef<InventoryItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(MIN_ITEM_COUNT);
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingCounterRef = useRef<number>(0);
  const [accountsToLoad, setAccountsToLoad] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const [api] = useState(() => {
    const apiInstance = new D2BotAPI();
    apiInstance.config.host = apiUrl;
    apiInstance.config.username = username;

    return apiInstance;
  });

  const filteredInventory = useMemo(() => {
    return (searchTerm ? searchResults : inventory).filter((item) => {
      if (selectedAccount !== "Show All" && item.account !== selectedAccount)
        return false;
      if (
        selectedCharacter !== "Show All" &&
        item.character !== selectedCharacter
      )
        return false;
      if (qualityFilter !== null && item.quality !== qualityFilter)
        return false;
      return true;
    });
  }, [
    inventory,
    searchResults,
    selectedAccount,
    selectedCharacter,
    qualityFilter,
    searchTerm,
  ]);

  const visibleInventory = useMemo(
    () => filteredInventory.slice(0, visibleCount),
    [visibleCount, filteredInventory],
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

    return () => {
      stopPolling();
    };
  }, [api]);

  useEffect(() => {
    if (session) fetchAccounts();
    // eslint-disable-next-line
  }, [realm, gameType, gameMode, gameClass, session]);

  useEffect(() => {
    if (session) {
      resetAccountLoading();
    }
    // eslint-disable-next-line
  }, [
    accounts,
    realm,
    selectedAccount,
    selectedCharacter,
    session,
    gameType,
    gameMode,
    gameClass,
  ]);

  useEffect(() => {
    if (
      selectedAccount !== "Show All" &&
      !accounts[selectedAccount]?.includes(selectedCharacter)
    ) {
      setSelectedCharacter("Show All");
    }
  }, [selectedAccount, accounts, selectedCharacter]);

  useEffect(() => {
    if (session) {
      startPolling();
    } else {
      stopPolling();
    }
    // eslint-disable-next-line
  }, [session]);

  useEffect(() => {
    if (!session || accountsToLoad.length === 0) return;
    fullInventoryRef.current = [];
    setIsFetchingMore(true);
    setVisibleCount(MIN_ITEM_COUNT);

    (async () => {
      setLoadingInventory(true);
      const acc = accountsToLoad[0];
      const items = await loadAccount(acc);
      setInventory(items);
      setLoadingInventory(false);
      fullInventoryRef.current = items;
      setHasMore(accountsToLoad.length > 1);

      // Start worker for the rest
      if (accountsToLoad.length > 1) {
        if (workerRef.current) workerRef.current.terminate();
        const worker = new Worker(
          new URL("./workers/inventoryWorker.ts", import.meta.url),
          { type: "module" },
        );
        workerRef.current = worker;
        let done = false;

        const doneTimeout = setTimeout(() => {
          if (!done) setIsFetchingMore(false);
        }, 60000);

        worker.onmessage = (e: MessageEvent) => {
          const msg = e.data;
          if (msg.type === "account-items") {
            fullInventoryRef.current = appendUniqueItems(
              fullInventoryRef.current,
              msg.items,
            );
          } else if (msg.type === "done") {
            done = true;
            setIsFetchingMore(false);
            setHasMore(false);
            clearTimeout(doneTimeout);
          } else if (msg.type === "error") {
            setIsFetchingMore(false);
            clearTimeout(doneTimeout);
          }
        };

        worker.postMessage({
          type: "load-accounts",
          accounts: accountsToLoad.slice(1),
          accountsMap: accounts,
          selectedCharacter,
          realm,
          gameClass,
          gameType,
          gameMode,
          apiUrl,
          session: api.config.session,
          username,
          password: useAppStore.getState().password,
        });
      } else {
        setIsFetchingMore(false);
        setHasMore(false);
      }
    })();
    // eslint-disable-next-line
  }, [
    accountsToLoad,
    session,
    selectedCharacter,
    realm,
    gameClass,
    gameType,
    gameMode,
    apiUrl,
  ]);

  useEffect(() => {
    setHasMore(
      fullInventoryRef.current.length > visibleCount || isFetchingMore,
    );
  }, [visibleCount, isFetchingMore]);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      setVisibleCount(MIN_ITEM_COUNT);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (hasMore) {
      setInventory(fullInventoryRef.current.slice(0, visibleCount));
    }
  }, [hasMore, visibleCount]);

  // Helper to append items without duplicates
  function appendUniqueItems(prev: InventoryItem[], newItems: InventoryItem[]) {
    const existingIds = new Set(prev.map((i) => i.itemid));
    return prev.concat(newItems.filter((i) => !existingIds.has(i.itemid)));
  }

  function handleSignOut() {
    workerRef.current?.terminate();
    setSession(null);
    setPassword("");
    setAccounts({});
    setInventory([]);
    clearCart();
    setSelectedAccount("Show All");
    setSelectedCharacter("Show All");
    toast.success("Signed out successfully!");

    // Stop polling when signed out
    stopPolling();
  }

  function startPolling() {
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
              if (message && message.body) {
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
  }

  function stopPolling() {
    if (pollingIntervalRef.current !== null) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingCounterRef.current = 0;
  }

  async function fetchAccounts() {
    if (!session) return;

    try {
      setLoadingAccounts(true);
      const response = await api.accounts(realm);

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
      console.debug("Fetched accounts:", accountsData);
      const accountsMap: Record<string, string[]> = {};

      for (const account of accountsData) {
        const res = account.split("\\");
        if (!res || res.length < 3) continue;

        if (!accountsMap[res[1]]) {
          accountsMap[res[1]] = [];
        }

        const charkey = res[2].split(".")[1];

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
          accountsMap[res[1]].push(res[2]);
        }
      }

      setAccounts((prev) =>
        deepEqual(prev, accountsMap) ? prev : accountsMap,
      );
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }

  // Natural sort helper for account names
  function naturalSort(a: string, b: string) {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  function resetAccountLoading() {
    if (selectedAccount === "Show All") {
      const accs = Object.keys(accounts).sort(naturalSort);
      setAccountsToLoad(accs);
      setHasMore(accs.length > 0);
    } else {
      setAccountsToLoad([selectedAccount]);
      setHasMore(false);
    }
  }

  // Load items for a single account (used for both UI and background loading)
  async function loadAccount(acc: string): Promise<InventoryItem[]> {
    let charList: string[] = [];
    if (selectedCharacter === "Show All") {
      charList = accounts[acc] || [];
    } else {
      charList = [selectedCharacter];
    }
    const queries: Promise<ApiResponse | ApiItemResponse[]>[] = [];
    for (const charname of charList) {
      queries.push(api.query("", realm, acc, charname));
    }
    const results = await Promise.all(queries);
    let allResults: ApiItemResponse[] = [];
    for (const resp of results) {
      if (
        resp &&
        !Array.isArray(resp) &&
        resp.status === "failed" &&
        resp.body === "invalid session"
      ) {
        handleSignOut();
        toast.error("Session Error", {
          description: "Your session has expired, please log in again",
        });
        setIsFetchingMore(false);
        return [];
      }
      if (Array.isArray(resp)) {
        allResults = allResults.concat(resp);
      }
    }
    const checks = {
      ladder: gameClass === "Ladder",
      lod: gameType === "Expansion",
      sc: gameMode === "Softcore",
    };
    return allResults
      .filter(
        (item) =>
          item.ladder === checks.ladder &&
          item.lod === checks.lod &&
          item.sc === checks.sc,
      )
      .map((el) => {
        const [desc, id] = el.description.split("$");
        const { quality, classid } = extractItemInfo(id, desc);
        return {
          ...el,
          title: desc.split("\n")[0],
          description: desc,
          itemid: id,
          realm: realm.toLowerCase(),
          quality,
          classid,
        };
      });
  }

  function handleLoadMore() {
    setVisibleCount((prev) => {
      const next = prev + MIN_ITEM_COUNT;
      return next;
    });
  }

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
        const items = response.map((el: ApiItemResponse) => {
          const [desc, id] = el.description.split("$");
          const { quality, classid } = extractItemInfo(id, desc);
          return {
            ...el,
            title: desc.split("\n")[0],
            description: desc,
            itemid: id,
            realm: realm.toLowerCase(),
            quality,
            classid,
          };
        });
        const existingIds = new Set(
          fullInventoryRef.current.map((i) => i.itemid),
        );
        const newItems = items.filter((i) => !existingIds.has(i.itemid));
        if (newItems.length > 0) {
          fullInventoryRef.current = fullInventoryRef.current.concat(newItems);
        }
        setSearchResults(items);
      }
    } catch (err) {
      toast.error("Search failed", { description: String(err) });
    } finally {
      setLoadingInventory(false);
    }
  }

  function handleClearDropsFromInvo() {
    const cart = useAppStore.getState().cart;
    const droppedIds = new Set(cart.map((i) => i.itemid));
    setInventory((prev) => prev.filter((item) => !droppedIds.has(item.itemid)));
    fullInventoryRef.current = fullInventoryRef.current.filter(
      (item) => !droppedIds.has(item.itemid),
    );
  }

  return (
    <div
      className="w-screen h-screen min-h-0 min-w-0 bg-gray-900 text-white flex flex-col overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      <Topbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        session={session}
        username={username}
        handleSignOut={handleSignOut}
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        onSearch={handleSearch}
        api={api}
        setSession={setSession}
        startPolling={startPolling}
        fetchAccounts={fetchAccounts}
      />

      <RecentDrops username={username} session={session} />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <Sidebar
          realm={realm}
          gameType={gameType}
          gameMode={gameMode}
          gameClass={gameClass}
          session={session}
          accounts={accounts}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          selectedCharacter={selectedCharacter}
          setSelectedCharacter={setSelectedCharacter}
          loadingAccounts={loadingAccounts}
          fetchAccounts={fetchAccounts}
        />
        <main className="flex-1 min-h-0 min-w-0 p-2 bg-gray-900 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full min-h-0 min-w-0">
            <section className="md:col-span-3 bg-gray-800 rounded shadow p-4 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
              <InventoryGrid
                session={session}
                inventory={visibleInventory}
                loadingInventory={loadingInventory}
                qualityFilter={qualityFilter}
                setQualityFilter={setQualityFilter}
                fetchInventory={async () => {
                  resetAccountLoading();
                }}
                loadingAccounts={loadingAccounts}
                hasMore={hasMore}
                isFetchingMore={isFetchingMore}
                onLoadMore={handleLoadMore}
              />
            </section>
          </div>
        </main>
      </div>
      <CartDrawer
        api={api}
        handleClearDropsFromInvo={handleClearDropsFromInvo}
      />
      <footer className="text-center py-4 text-gray-400 bg-gray-800 mt-auto w-full">
        &copy; 2025 Lime Drop. All rights reserved.
      </footer>
    </div>
  );
}
