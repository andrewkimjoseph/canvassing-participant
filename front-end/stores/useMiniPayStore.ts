import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MiniPayStoreState {
  isMiniPay: boolean;
  isMiniPayContext: boolean;
  setIsMiniPay: (value: boolean) => void;
  setIsMiniPayContext: (value: boolean) => void;
}

const useMiniPayStore = create<MiniPayStoreState>()(
  persist(
    (set) => ({
      isMiniPay: false,
      isMiniPayContext: false,
      setIsMiniPay: (value: boolean) => set({ isMiniPay: value }),
      setIsMiniPayContext: (value: boolean) => set({ isMiniPayContext: value }),
    }),
    {
      name: "minipay-storage",
    }
  )
);

export default useMiniPayStore;
