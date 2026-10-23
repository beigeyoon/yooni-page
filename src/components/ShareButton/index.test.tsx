// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareButton } from '.';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const writeText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  });
  window.history.replaceState(
    null,
    '',
    '/travel/%EC%B9%98%EC%95%99%EB%A7%88%EC%9D%B4?utm=x#comments'
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ShareButton />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const button = () => container.querySelector('button')!;
const tooltip = () => container.querySelector('[role="status"]')!;

async function click() {
  await act(async () => {
    button().click();
  });
}

describe('ShareButton', () => {
  it('처음에는 툴팁이 보이지 않는다', () => {
    expect(tooltip().getAttribute('data-visible')).toBe('false');
  });

  it('쿼리와 해시를 뺀 글 주소를 복사하고 툴팁을 띄운다', async () => {
    await click();

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/travel/%EC%B9%98%EC%95%99%EB%A7%88%EC%9D%B4`
    );
    expect(tooltip().getAttribute('data-visible')).toBe('true');
    expect(tooltip().textContent).toBe('링크가 복사되었습니다!');
  });

  it('3초 뒤 툴팁이 사라진다', async () => {
    await click();
    act(() => vi.advanceTimersByTime(2999));
    expect(tooltip().getAttribute('data-visible')).toBe('true');
    act(() => vi.advanceTimersByTime(1));
    expect(tooltip().getAttribute('data-visible')).toBe('false');
  });

  it('다시 누르면 3초를 처음부터 다시 센다', async () => {
    await click();
    act(() => vi.advanceTimersByTime(2000));
    await click();
    act(() => vi.advanceTimersByTime(2000));
    expect(tooltip().getAttribute('data-visible')).toBe('true');
    act(() => vi.advanceTimersByTime(1000));
    expect(tooltip().getAttribute('data-visible')).toBe('false');
  });

  it('클립보드 API가 실패하면 execCommand로 복사한다', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn(() => true);
    document.execCommand = execCommand;

    await click();

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(tooltip().textContent).toBe('링크가 복사되었습니다!');
  });

  it('둘 다 실패하면 실패를 알린다', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    document.execCommand = vi.fn(() => false);

    await click();

    expect(tooltip().getAttribute('data-visible')).toBe('true');
    expect(tooltip().textContent).toBe('링크를 복사하지 못했습니다.');
  });
});
