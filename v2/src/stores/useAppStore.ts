import type { InventoryItem } from "@/lib/utils";
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

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

export function handleClearDropsFromInvo() {
  const cart = useAppStore.getState().cart;
  const droppedIds = new Set(cart.map((i) => i.itemid));
  const prevInvo = useAppStore.getState().inventory;
  const newInvo = prevInvo.filter((item) => !droppedIds.has(item.itemid));
  setInventory(newInvo);
}

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
