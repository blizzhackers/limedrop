import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { D2BotAPI, type ApiItemResponse, type ApiResponse } from "@/lib/D2Bot";
import { toast } from "sonner";
import { setApiUrl, setUsername, useAppStore } from "@/stores/useAppStore";
import { Topbar } from "@/components/Topbar";
import { Sidebar } from "@/components/Sidebar";
import { InventoryGrid } from "@/components/InventoryGrid";
import { CartDrawer } from "@/components/CartDrawer";
import { deepEqual, extractItemInfo, type InventoryItem } from "@/lib/utils";

declare global {
  interface Window {
    sessionFailCount?: number;
  }
}

export default function App() {
  const realm = useAppStore((s) => s.realm);
  const gameType = useAppStore((s) => s.gameType);
  const gameMode = useAppStore((s) => s.gameMode);
  const gameClass = useAppStore((s) => s.gameClass);
  const apiUrl = useAppStore((s) => s.apiUrl);
  const username = useAppStore((s) => s.username);
  const gameName = useAppStore((s) => s.gameName);

  const [loginOpen, setLoginOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accounts, setAccounts] = useState<Record<string, string[]>>({});
  const [selectedAccount, setSelectedAccount] = useState<string>("Show All");
  const [selectedCharacter, setSelectedCharacter] = useState<string>("Show All");
  const [cart, setCart] = useState<InventoryItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [gamePass, setGamePass] = useState("");
  
  // Reference to polling interval
  const pollingIntervalRef = useRef<number | null>(null);
  // Counter for polling - used to reduce frequency of actual API calls
  const pollingCounterRef = useRef<number>(0);

  // D2BotAPI instance (persisted)
  const [api] = useState(() => {
    const apiInstance = new D2BotAPI();
    apiInstance.config.host = apiUrl;
    apiInstance.config.username = username;
    
    return apiInstance;
  });
  
  useEffect(() => {
    const pingApi = async () => {
      try {
        const res = await api.PING();
        console.log(JSON.stringify(res, null, 2));
        console.log("API is reachable");
      } catch (err) {
        console.error("API is unreachable:", err);
      }
    }
    pingApi();
    
    toast.success("Notification", { description: "Welcome to Lime Drop!" })
    
    return () => {
      stopPolling();
    };
  }, [api]);

  // Login handler
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    try {
      await api.login(username, password, apiUrl);
      setSession(api.config.session || null);
      setLoginOpen(false);
      toast.success("Login successful!", { description: "Welcome to LimeDrop!"});
      fetchAccounts();
      fetchInventory();
      
      // Start polling
      startPolling();
    } catch (err: unknown) {
      setLoginError((err as Error).message || "Login failed");
    }
  }

  // Sign out handler
  function handleSignOut() {
    setSession(null);
    setPassword("");
    setInventory([]);
    setAccounts({});
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
          const response = await api.poll();
          
          // Handle failed responses with invalid session
          if (response && response.status === "failed" && response.body === "invalid session") {
            console.log("Polling detected invalid session, may need to log in again");
            
            let sessionFailCount = (window).sessionFailCount || 0;
            sessionFailCount++;
            (window).sessionFailCount = sessionFailCount;
            
            if (sessionFailCount > 3) {
              console.error("Too many failed session attempts, logging out");
              handleSignOut();
              toast.error("Session Error", { description: "Your session has expired, please log in again" });
              (window).sessionFailCount = 0;
            }
            return;
          }
          
          // Reset the failure counter on success
          (window).sessionFailCount = 0;
          
          // Handle empty response
          if (
            (response && response.body === "empty")
            || (
              response && response.status === "success" && (!response.body || response.body === "empty")
            )
          ) {
            return;
          }
          
          if (response && Array.isArray(response)) {
            for (const message of response) {
              if (message && message.body) {
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
          
          if (error instanceof Error && error.message.includes("invalid session")) {
            // Don't flood the console with repeated errors
            console.log("Polling error with invalid session");
            
            let sessionFailCount = (window).sessionFailCount || 0;
            sessionFailCount++;
            (window).sessionFailCount = sessionFailCount;
            
            if (sessionFailCount > 3) {
              console.error("Too many failed session attempts, logging out");
              handleSignOut();
              toast.error("Session Error", { description: "Your session has expired, please log in again" });
              (window).sessionFailCount = 0;
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
          console.error("Invalid session detected, session needs to be refreshed");
          handleSignOut();
          toast.error("Session Error", { description: "Your session has expired, please log in again" });
          return;
        }
        return;
      }
      
      const { body: accountsData } = response;
      
      if (!Array.isArray(accountsData)) {
        console.error("Unexpected accounts data format:", accountsData);
        return;
      }
      
      console.debug("Fetched accounts:", accountsData);
      const accountsMap: Record<string, string[]> = {};
      
      // Process accounts data similar to the original version
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
          sc: charkey[0] === "s"
        };
        
        const checks = {
          ladder: gameClass === "Ladder",
          lod: gameType === "Expansion",
          sc: gameMode === "Softcore"
        };
        
        if ((charCheck.ladder === checks.ladder) && 
            (charCheck.lod === checks.lod) && 
            (charCheck.sc === checks.sc)) {
          accountsMap[res[1]].push(res[2]);
        }
      }
      
      setAccounts(prev => deepEqual(prev, accountsMap) ? prev : accountsMap);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function fetchInventory() {
    if (!session) return;
    
    try {
      setLoadingInventory(true);
      let accountList: string[] = [];
      if (selectedAccount === "Show All") {
        accountList = Object.keys(accounts);
      } else {
        accountList = [selectedAccount];
      }
      
      const queries: Promise<ApiResponse | ApiItemResponse[]>[] = [];
      for (const acc of accountList) {
        let charList: string[] = [];
        if (selectedCharacter === "Show All") {
          charList = accounts[acc] || [];
        } else {
          charList = [selectedCharacter];
        }
        for (const charname of charList) {
          queries.push(api.query("", realm, acc, charname));
        }
      }
      
      // Fetch all in parallel
      const results = await Promise.all(queries);
      let allResults: ApiItemResponse[] = [];
      for (const resp of results) {
        if (resp && !Array.isArray(resp) && resp.status === "failed" && resp.body === "invalid session") {
          handleSignOut();
          toast.error("Session Error", { description: "Your session has expired, please log in again" });
          setInventory([]);
          setLoadingInventory(false);
          return;
        }
        if (Array.isArray(resp)) {
          allResults = allResults.concat(resp);
        }
      }

      // console.log(JSON.stringify(allResults, null, 2));
      // Filter aggregated results
      const checks = {
        ladder: gameClass === "Ladder",
        lod: gameType === "Expansion",
        sc: gameMode === "Softcore"
      };
      const filtered = allResults.filter(item =>
        item.ladder === checks.ladder &&
        item.lod === checks.lod &&
        item.sc === checks.sc
      ).map(el => {
        const [desc, id] = el.description.split("$");
        const { quality, classid } = extractItemInfo(id, desc);
        return { ...el, title: desc.split("\n")[0], description: desc, itemid: id, realm: realm.toLowerCase(), quality, classid };
      });
      setInventory(prev => deepEqual(prev, filtered) ? prev : filtered);
      setFullInventory(prev => deepEqual(prev, filtered) ? prev : filtered); // Save the full list for client-side search
    } catch (err) {
      console.error("Error fetching inventory:", err);
      if (err instanceof Error && err.message.includes("invalid session")) {
        handleSignOut();
        toast.error("Session Error", { description: "Your session has expired, please log in again" });
        
      }
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }

  const [fullInventory, setFullInventory] = useState<InventoryItem[]>([]);
  const [qualityFilter, setQualityFilter] = useState<number | null>(null);

  useEffect(() => {
    let filtered = fullInventory;
    if (qualityFilter !== null) {
      filtered = filtered.filter(item => item.quality === qualityFilter);
    }
    if (!searchTerm) {
      setInventory(filtered);
    } else {
      const lower = searchTerm.toLowerCase();
      setInventory(filtered.filter(item =>
        item.description.toLowerCase().includes(lower) ||
        item.account.toLowerCase().includes(lower) ||
        item.character.toLowerCase().includes(lower) ||
        (item.title && item.title.toLowerCase().includes(lower))
      ));
    }
  }, [searchTerm, fullInventory, qualityFilter]);

  useEffect(() => {
    if (session) fetchAccounts();
    // eslint-disable-next-line
  }, [realm, gameType, gameMode, gameClass, session]);

  useEffect(() => {
    if (session) fetchInventory();
    // eslint-disable-next-line
  }, [accounts, realm, selectedAccount, selectedCharacter, session, gameType, gameMode, gameClass]);

  useEffect(() => {
    if (selectedAccount !== "Show All" && !accounts[selectedAccount]?.includes(selectedCharacter)) {
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

  function handleSelectItem(item: InventoryItem) {
    setCart((prev) => {
      if (prev.find((i) => i.itemid === item.itemid)) {
        return prev.filter((i) => i.itemid !== item.itemid);
      }
      return [...prev, item];
    });
  }

  function handleRemoveFromCart(item: InventoryItem) {
    setCart((prev) => prev.filter((i) => i.itemid !== item.itemid));
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
      const hash = await api.md5((realm).toLowerCase() + (item.account || '').toLowerCase());
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
        data: JSON.stringify({ gameName, gamePass, items: drops[hash] })
      };
      console.debug("GameAction", JSON.stringify(GameInfo, null, 2));
      await api.gameaction(GameInfo); // You may want to handle errors/feedback
    }
    setCart([]);
    setCartOpen(false);
    toast.info("Drop Queue", { description: "Drop action sent!" });
  }

  const allVisibleSelected = inventory.length > 0 && inventory.every(item => cart.some(i => i.itemid === item.itemid));
  function handleToggleSelectAll() {
    if (allVisibleSelected) {
      setCart(prev => prev.filter(item => !inventory.some(i => i.itemid === item.itemid)));
    } else {
      setCart(prev => {
        const ids = new Set(prev.map(i => i.itemid));
        const toAdd = inventory.filter(i => !ids.has(i.itemid));
        return [...prev, ...toAdd];
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Topbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        cartCount={cart.length}
        onCartOpen={() => setCartOpen(true)}
        session={session}
        username={username}
        loginOpen={loginOpen}
        setLoginOpen={setLoginOpen}
        handleSignOut={handleSignOut}
        handleLogin={handleLogin}
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        setUsername={setUsername}
      />
      <div className="flex flex-1">
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
        <main className="flex-1 p-2 bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <section className="md:col-span-3 bg-gray-800 rounded shadow p-4 flex flex-col" style={{ minHeight: '80vh' }}>
              <InventoryGrid
                session={session}
                inventory={inventory}
                loadingInventory={loadingInventory}
                cart={cart}
                handleSelectItem={handleSelectItem}
                allVisibleSelected={allVisibleSelected}
                handleToggleSelectAll={handleToggleSelectAll}
                qualityFilter={qualityFilter}
                setQualityFilter={setQualityFilter}
                fetchInventory={fetchInventory}
                loadingAccounts={loadingAccounts}
              />
            </section>
          </div>
        </main>
      </div>
      <CartDrawer
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cart={cart}
        handleRemoveFromCart={handleRemoveFromCart}
        gameName={gameName}
        gamePass={gamePass}
        setGamePass={setGamePass}
        handleDropCart={handleDropCart}
      />
      <footer className="text-center py-4 text-gray-400 bg-gray-800 mt-auto">
        &copy; 2025 Lime Drop. All rights reserved.
      </footer>
    </div>
  );
}
