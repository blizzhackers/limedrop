import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  realm: string;
  gameType: string;
  gameMode: string;
  gameClass: string;
  apiUrl: string;
  username: string;
  gameName: string;
}

interface AppActions {
  setRealm: (realm: string) => void;
  setGameType: (gameType: string) => void;
  setGameMode: (gameMode: string) => void;
  setGameClass: (gameClass: string) => void;
  setApiUrl: (apiUrl: string) => void;
  setUsername: (username: string) => void;
  setGameName: (gameName: string) => void;
}

export type AppStore = AppState & AppActions;

// Action implementations
export const setRealm = (realm: string) => useAppStore.setState({ realm });
export const setGameType = (gameType: string) => useAppStore.setState({ gameType });
export const setGameMode = (gameMode: string) => useAppStore.setState({ gameMode });
export const setGameClass = (gameClass: string) => useAppStore.setState({ gameClass });
export const setApiUrl = (apiUrl: string) => useAppStore.setState({ apiUrl });
export const setUsername = (username: string) => useAppStore.setState({ username });
export const setGameName = (gameName: string) => useAppStore.setState({ gameName });

export const useAppStore = create<AppState>()(
  persist(
    () => ({
      realm: 'USEast',
      gameType: 'Expansion',
      gameMode: 'Softcore',
      gameClass: 'Ladder',
      apiUrl: 'http://localhost:8080',
      username: '',
      gameName: "",
    }),
    {
      name: 'limedrop-app',
      partialize: (state) => ({
        realm: state.realm,
        gameType: state.gameType,
        gameMode: state.gameMode,
        gameClass: state.gameClass,
        apiUrl: state.apiUrl,
        username: state.username,
        gameName: state.gameName
      }),
    }
  )
);
