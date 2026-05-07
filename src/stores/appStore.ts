import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { ItemPack } from "@/db/itemPacksDb";
import { getRecentDrops } from "@/db/recentDropsDb";
import type {
  GameClass,
  GameMode,
  GameRealm,
  GameType,
  InventoryItem,
} from "@/lib/utils";

interface AppState {
  realm: GameRealm;
  gameType: GameType;
  gameMode: GameMode;
  gameClass: GameClass;
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
  accountDataCache: AccountDataCache[];
  accounts: Record<string, string[]>;
  inventoryCache: Record<string, InventoryCacheEntry>;
  drops: DropItem[];
  packs: ItemPack[];
  session: string | null;
  showDebugInfo: boolean;
  loginOpen: boolean;
}

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
      accounts: {},
      accountDataCache: [],
      inventoryCache: {},
      drops: [],
      packs: [],
      session: null,
      showDebugInfo: false,
      loginOpen: false,
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
export const setRealm = (realm: GameRealm) => {
  useAppStore.setState({ realm });
};

export const setGameType = (gameType: GameType) => {
  useAppStore.setState({ gameType });
};

export const setGameMode = (gameMode: GameMode) => {
  useAppStore.setState({ gameMode });
};

export const setGameClass = (gameClass: GameClass) => {
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
    if (state.cartItemIds.has(item.itemid)) return {};
    const cart = [...state.cart, item];
    const cartItemIds = new Set(state.cartItemIds);
    cartItemIds.add(item.itemid);
    return { cart, cartItemIds };
  });
};

export const removeFromCart = (item: InventoryItem) => {
  useAppStore.setState((state) => {
    const cart = state.cart.filter((i) => i.itemid !== item.itemid);
    const cartItemIds = new Set(state.cartItemIds);
    cartItemIds.delete(item.itemid);
    return { cart, cartItemIds };
  });
};

export const clearCart = () => {
  useAppStore.setState({ cart: [], cartItemIds: new Set() });
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

export const setLoginOpen = (loginOpen: boolean) => {
  useAppStore.setState({ loginOpen });
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
