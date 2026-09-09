import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingStore } from './useLoadingStore';

// 오버레이는 "이동이 오래 걸릴 때만" 보여야 한다. prefetch된 페이지는 수십 ms 만에
// 도착하므로 시작 즉시 켜면 클릭마다 깜빡인다. 켜는 쪽은 150ms 지연, 끄는 쪽은
// 도착 후 300ms 유지(기존 동작)다.

const state = () => useLoadingStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  useLoadingStore.setState({ isRouting: false, showLoading: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLoadingStore: 오버레이 표시 타이밍', () => {
  it('이동이 시작돼도 150ms 전에는 오버레이를 켜지 않는다', () => {
    state().setIsRouting(true);
    expect(state().isRouting).toBe(true);

    vi.advanceTimersByTime(149);
    expect(state().showLoading).toBe(false);

    vi.advanceTimersByTime(1);
    expect(state().showLoading).toBe(true);
  });

  it('150ms 안에 도착하면 오버레이를 아예 켜지 않는다', () => {
    state().setIsRouting(true);
    vi.advanceTimersByTime(50);
    expect(state().showLoading).toBe(false);

    state().setIsRouting(false);
    vi.advanceTimersByTime(1000);
    expect(state().showLoading).toBe(false);
  });

  it('켜진 오버레이는 도착 후 300ms 뒤에 끈다', () => {
    state().setIsRouting(true);
    vi.advanceTimersByTime(150);
    expect(state().showLoading).toBe(true);

    state().setIsRouting(false);
    vi.advanceTimersByTime(299);
    expect(state().showLoading).toBe(true);

    vi.advanceTimersByTime(1);
    expect(state().showLoading).toBe(false);
  });

  it('끄기 대기 중 다시 이동이 시작되면 오버레이를 유지한다', () => {
    state().setIsRouting(true);
    vi.advanceTimersByTime(150);
    state().setIsRouting(false);
    vi.advanceTimersByTime(100);

    state().setIsRouting(true);
    vi.advanceTimersByTime(1000);
    expect(state().showLoading).toBe(true);
  });
});
