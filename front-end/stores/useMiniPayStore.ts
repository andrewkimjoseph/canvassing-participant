import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MiniPayStoreState {
  isMiniPay: boolean;
  setIsMiniPay: (value: boolean) => void;
}

const useMiniPayStore = create<MiniPayStoreState>()(
  persist(
    (set) => ({
      isMiniPay: false,
      setIsMiniPay: (value: boolean) => set({ isMiniPay: value })
    }),
    {
      name: 'minipay-storage',
    }
  )
);

export default useMiniPayStore;