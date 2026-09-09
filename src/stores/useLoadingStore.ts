import { create } from 'zustand';

// prefetch된 페이지는 수십 ms 만에 도착한다. 이동 시작 즉시 오버레이를 켜면 클릭마다
// 깜빡이므로, 이 시간 안에 도착하지 못한 이동에만 켠다.
const SHOW_DELAY_MS = 150;
// 도착 직후 바로 끄면 새 화면이 그려지는 동안 깜빡인다.
const HIDE_DELAY_MS = 300;

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
  showTimer = null;
  hideTimer = null;
}

type State = {
  isRouting: boolean;
  showLoading: boolean;
  setIsRouting: (isRouting: boolean) => void;
};

export const useLoadingStore = create<State>((set, get) => ({
  isRouting: false,
  showLoading: false,

  setIsRouting: (isRouting) => {
    clearTimers();

    if (isRouting) {
      set({ isRouting: true });
      if (!get().showLoading) {
        showTimer = setTimeout(() => {
          showTimer = null;
          set({ showLoading: true });
        }, SHOW_DELAY_MS);
      }
      return;
    }

    set({ isRouting: false });
    if (get().showLoading) {
      hideTimer = setTimeout(() => {
        hideTimer = null;
        set({ showLoading: false });
      }, HIDE_DELAY_MS);
    }
  }
}));
