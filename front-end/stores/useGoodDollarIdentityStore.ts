import { Address } from "viem";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GoodDollarIdentityState {
  isWhitelisted?: boolean | null;
  root?: Address | null;
  setIsWhitelisted: (value: boolean) => void;
  setRoot: (value: Address) => void;
}

const useGoodDollarIdentityStore = create<GoodDollarIdentityState>()(
  persist(
    (set) => ({
        isWhitelisted: null,
        root: null,
        setIsWhitelisted: (value: boolean) => set({ isWhitelisted: value }),
        setRoot: (value: Address) => set({ root: value }),
    }),
    {
      name: "identity-storage", // unique name
    }
  )
);

export default useGoodDollarIdentityStore;
