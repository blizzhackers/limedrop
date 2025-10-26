import { create } from "zustand";

interface ItemPacksDialogStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useItemPacksDialogStore = create<ItemPacksDialogStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
