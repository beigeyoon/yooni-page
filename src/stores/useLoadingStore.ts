import { create } from 'zustand';

let delayTimer: ReturnType<typeof setTimeout> | null = null;

type State = {
  isRouting: boolean;
  showLoading: boolean;
  setIsRouting: (isRouting: boolean) => void;
};

export const useLoadingStore = create<State>((set) => ({
  isRouting: false,
  showLoading: false,

  setIsRouting: (isRouting) => {
    console.log('[setIsRouting]', isRouting);

    if (isRouting) {
      if (delayTimer) {
        clearTimeout(delayTimer);
        delayTimer = null;
      }

      set({ isRouting: true, showLoading: true });
    } else {
      set({ isRouting: false });

      delayTimer = setTimeout(() => {
        set({ showLoading: false });
        delayTimer = null;
      }, 300);
    }
  }
}));