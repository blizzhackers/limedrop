import { create } from "zustand";

interface ConvertNLDialogStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useConvertNLDialogStore = create<ConvertNLDialogStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
