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
  gameName: string;
  cart: InventoryItem[];
  cartItemIds: Set<string>;
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
}

export type AppStore = AppState & AppActions;

// Action implementations
export const setRealm = (realm: string) => useAppStore.setState({ realm });
export const setGameType = (gameType: string) =>
  useAppStore.setState({ gameType });
export const setGameMode = (gameMode: string) =>
  useAppStore.setState({ gameMode });
export const setGameClass = (gameClass: string) =>
  useAppStore.setState({ gameClass });
export const setApiUrl = (apiUrl: string) => useAppStore.setState({ apiUrl });
export const setUsername = (username: string) =>
  useAppStore.setState({ username });
export const setGameName = (gameName: string) =>
  useAppStore.setState({ gameName });
export const setCart = (cart: InventoryItem[]) =>
  useAppStore.setState({ cart });
export const addToCart = (item: InventoryItem) =>
  useAppStore.setState((state) => {
    if (state.cart.some((i) => i.itemid === item.itemid)) {
      return { cart: state.cart };
    }
    return { cart: [...state.cart, item] };
  });
export const removeFromCart = (item: InventoryItem) =>
  useAppStore.setState((state) => ({
    cart: state.cart.filter((i) => i.itemid !== item.itemid),
  }));
export const clearCart = () => useAppStore.setState({ cart: [] });

export const useCartItemIds = () =>
  useAppStore((state) => new Set(state.cart.map((i) => i.itemid)));

export const useAppStore = create(
  persist(
    subscribeWithSelector<AppState>(() => ({
      realm: "USEast",
      gameType: "Expansion",
      gameMode: "Softcore",
      gameClass: "Ladder",
      apiUrl: "http://localhost:8080",
      username: "",
      gameName: "",
      cart: [],
      cartItemIds: new Set(),
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
