import { create } from "zustand";

interface DevScreenStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useDevScreenStore = create<DevScreenStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
