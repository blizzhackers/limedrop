import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { ItemPack } from "@/lib/itemPacksDb";
import { getRecentDrops } from "@/lib/recentDropsDb";
import type { InventoryItem } from "@/lib/utils";

interface AppState {
  realm: string;
  gameType: string;
  gameMode: string;
  gameClass: string;
  apiUrl: string;
  username: string;
  password: string;
  gameName: string;
  cart: InventoryItem[];
  cartItemIds: Set<string>;
  cartOpen: boolean;
  recentDropsOpen: boolean;
  inventory: InventoryItem[];
  loadingInventory: boolean;
  fullyLoaded: boolean;
  searchTerm: string;
  searchResults: InventoryItem[];
  selectedAccount: string;
  selectedCharacter: string;
  qualityFilter: number | null;
  accountDataCache: AccountDataCache[];
  accounts: Record<string, string[]>;
  inventoryCache: Record<string, InventoryCacheEntry>;
  drops: DropItem[];
  packs: ItemPack[];
  session: string | null;
  showDebugInfo: boolean;
}

interface AppActions {
  setRealm: (realm: string) => void;
  setGameType: (gameType: string) => void;
  setGameMode: (gameMode: string) => void;
  setGameClass: (gameClass: string) => void;
  setApiUrl: (apiUrl: string) => void;
  setUsername: (username: string) => void;
  setGameName: (gameName: string) => void;
  setCart: (cart: InventoryItem[]) => void;
  addToCart: (item: InventoryItem) => void;
  removeFromCart: (item: InventoryItem) => void;
  clearCart: () => void;
  setPassword: (password: string) => void;
  setCartOpen: (cartOpen: boolean) => void;
  setRecentDropsOpen: (open: boolean) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  setLoadingInventory: (loading: boolean) => void;
}

export type AppStore = AppState & AppActions;

export type AccountDataCache = {
  realm: string;
  accountName: string;
  charName: string;
  ladder: boolean;
  sc: boolean;
  lod: boolean;
};

export interface InventoryCacheEntry {
  items: InventoryItem[];
  timestamp: number;
  filters: {
    gameType: string;
    gameMode: string;
    gameClass: string;
    realm: string;
    selectedCharacter: string;
  };
}

export type DropItem = {
  id?: number;
  items: InventoryItem[];
  gameName: string;
  droppedAt: number;
};

export const useAppStore = create(
  persist(
    subscribeWithSelector<AppState>(() => ({
      realm: "USEast",
      gameType: "Expansion",
      gameMode: "Softcore",
      gameClass: "Ladder",
      apiUrl: "http://localhost:8080",
      username: "",
      password: "",
      gameName: "",
      cart: [],
      cartItemIds: new Set(),
      cartOpen: false,
      recentDropsOpen: false,
      inventory: [],
      loadingInventory: false,
      fullyLoaded: false,
      searchTerm: "",
      searchResults: [],
      selectedAccount: "Show All",
      selectedCharacter: "Show All",
      qualityFilter: null,
      accounts: {},
      accountDataCache: [],
      inventoryCache: {},
      drops: [],
      packs: [],
      session: null,
      showDebugInfo: false,
    })),
    {
      name: "limedrop-app",
      partialize: (state) => ({
        realm: state.realm,
        gameType: state.gameType,
        gameMode: state.gameMode,
        gameClass: state.gameClass,
        apiUrl: state.apiUrl,
        username: state.username,
        gameName: state.gameName,
      }),
    },
  ),
);

// Action implementations
export const setRealm = (realm: string) => {
  useAppStore.setState({ realm });
};

export const setGameType = (gameType: string) => {
  useAppStore.setState({ gameType });
};

export const setGameMode = (gameMode: string) => {
  useAppStore.setState({ gameMode });
};

export const setGameClass = (gameClass: string) => {
  useAppStore.setState({ gameClass });
};

export const setApiUrl = (apiUrl: string) => {
  useAppStore.setState({ apiUrl });
};

export const setUsername = (username: string) => {
  useAppStore.setState({ username });
};

export const setPassword = (password: string) => {
  useAppStore.setState({ password });
};

export const setGameName = (gameName: string) => {
  useAppStore.setState({ gameName });
};

export const setCart = (cart: InventoryItem[]) => {
  useAppStore.setState({ cart });
};

export const addToCart = (item: InventoryItem) => {
  useAppStore.setState((state) => {
    if (state.cart.some((i) => i.itemid === item.itemid)) {
      return { cart: state.cart };
    }
    return { cart: [...state.cart, item] };
  });
};

export const removeFromCart = (item: InventoryItem) => {
  useAppStore.setState((state) => {
    return { cart: state.cart.filter((i) => i.itemid !== item.itemid) };
  });
};

export const clearCart = () => {
  useAppStore.setState({ cart: [] });
};

export const setCartOpen = (cartOpen: boolean) => {
  useAppStore.setState({ cartOpen });
};

export const setRecentDropsOpen = (open: boolean) => {
  useAppStore.setState({ recentDropsOpen: open });
};

export const setInventory = (inventory: InventoryItem[]) => {
  useAppStore.setState({ inventory });
};

export const setLoadingInventory = (loading: boolean) => {
  useAppStore.setState({ loadingInventory: loading });
};

export const setFullyLoaded = (fullyLoaded: boolean) => {
  useAppStore.setState({ fullyLoaded });
};

export const setSearchTerm = (searchTerm: string) => {
  useAppStore.setState({ searchTerm });
};

export const setSearchResults = (searchResults: InventoryItem[]) => {
  useAppStore.setState({ searchResults });
};

export const setSelectedAccount = (selectedAccount: string) => {
  useAppStore.setState({ selectedAccount });
};

export const setSelectedCharacter = (selectedCharacter: string) => {
  useAppStore.setState({ selectedCharacter });
};

export const setQualityFilter = (qualityFilter: number | null) => {
  useAppStore.setState({ qualityFilter });
};

export const setAccountDataCache = (accountDataCache: AccountDataCache[]) => {
  useAppStore.setState({ accountDataCache });
};

export const setAccounts = (accounts: Record<string, string[]>) => {
  useAppStore.setState({ accounts });
};

export const setDrops = (drops: DropItem[]) => {
  useAppStore.setState({ drops });
};

export const setPacks = (packs: ItemPack[]) => {
  useAppStore.setState({ packs });
};

export const setSession = (session: string | null) => {
  useAppStore.setState({ session });
};

export const toggleDebugInfo = () => {
  useAppStore.setState((state) => ({ showDebugInfo: !state.showDebugInfo }));
};

export function handleClearDropsFromInvo() {
  const cart = useAppStore.getState().cart;
  const droppedIds = new Set(cart.map((i) => i.itemid));
  const prevInvo = useAppStore.getState().inventory;
  const newInvo = prevInvo.filter((item) => !droppedIds.has(item.itemid));
  setInventory(newInvo);

  const prevSearchResults = useAppStore.getState().searchResults;
  if (prevSearchResults.length > 0) {
    const newSearchResults = prevSearchResults.filter(
      (item) => !droppedIds.has(item.itemid),
    );
    setSearchResults(newSearchResults);
  }
}

export const cacheAccountItems = (account: string, items: InventoryItem[]) => {
  useAppStore.setState((state) => {
    const filters = {
      gameType: state.gameType,
      gameMode: state.gameMode,
      gameClass: state.gameClass,
      realm: state.realm,
      selectedCharacter: state.selectedCharacter,
    };

    // Cache key is account:realm
    const cacheKey = `${account}:${state.realm}`;

    return {
      inventoryCache: {
        ...state.inventoryCache,
        [cacheKey]: {
          items,
          timestamp: Date.now(),
          filters,
        },
      },
    };
  });
};

export const getItemsFromCache = (
  account: string,
  realm: string,
): InventoryItem[] | null => {
  const state = useAppStore.getState();
  const cacheKey = `${account}:${realm}`;
  const cacheEntry = state.inventoryCache[cacheKey];
  if (!cacheEntry) return null;
  if (Date.now() - cacheEntry.timestamp > 5 * 60 * 1000) return null;

  const currentFilters = {
    gameType: state.gameType,
    gameMode: state.gameMode,
    gameClass: state.gameClass,
    realm,
    selectedCharacter: state.selectedCharacter,
  };

  if (JSON.stringify(currentFilters) !== JSON.stringify(cacheEntry.filters)) {
    return null;
  }

  return cacheEntry.items;
};

export const clearInventoryCache = () => {
  useAppStore.setState({ inventoryCache: {} });
};

export const updateCachedDrops = () => {
  const username = useAppStore.getState().username;

  if (username) {
    getRecentDrops(username)
      .then((drops) => {
        useAppStore.setState({ drops });
      })
      .catch((err) => {
        console.error("Failed to fetch recent drops", err);
      });
  }
};

useAppStore.subscribe(
  (state) => state.cart,
  (cart) => {
    const newCartItemIds = new Set(cart.map((i) => i.itemid));
    const currentCartItemIds = useAppStore.getState().cartItemIds;
    if (
      newCartItemIds.size !== currentCartItemIds.size ||
      [...newCartItemIds].some((id) => !currentCartItemIds.has(id))
    ) {
      useAppStore.setState({ cartItemIds: newCartItemIds });
    }
  },
);
