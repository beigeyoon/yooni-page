import { describe, expect, it } from 'vitest';
import {
  formatDisplayDate,
  parseDbTimestamp,
  toIsoString
} from './dbTimestamp';

describe('parseDbTimestamp', () => {
  it('타임존 표시가 없으면 UTC로 해석한다', () => {
    // DB가 돌려주는 실제 형태
    expect(parseDbTimestamp('2026-08-05T02:45:51.881').toISOString()).toBe(
      '2026-08-05T02:45:51.881Z'
    );
  });

  it('Z가 붙어 있으면 그대로 존중한다', () => {
    expect(parseDbTimestamp('2026-08-05T02:45:51.881Z').toISOString()).toBe(
      '2026-08-05T02:45:51.881Z'
    );
  });

  it('오프셋이 붙어 있으면 그대로 존중한다', () => {
    expect(parseDbTimestamp('2026-08-05T11:45:51.881+09:00').toISOString()).toBe(
      '2026-08-05T02:45:51.881Z'
    );
  });

  it('Date를 넘기면 그대로 돌려준다', () => {
    const d = new Date('2026-08-05T02:45:51.881Z');
    expect(parseDbTimestamp(d)).toBe(d);
  });
});

describe('formatDisplayDate', () => {
  it('한국 시간 기준 날짜를 반환한다', () => {
    // UTC 15:41은 한국시간으로 다음 날 00:41이다
    expect(formatDisplayDate('2025-05-14T15:41:09.503')).toBe('2025. 05. 15.');
  });

  it('같은 날 안에 있으면 날짜가 그대로다', () => {
    expect(formatDisplayDate('2025-05-14T01:00:00.000')).toBe('2025. 05. 14.');
  });

  it('연말 경계에서도 한국 날짜로 넘어간다', () => {
    // UTC 12월 31일 20시 = 한국 1월 1일 05시
    expect(formatDisplayDate('2025-12-31T20:00:00.000')).toBe('2026. 01. 01.');
  });

  it('실행 환경 타임존과 무관하게 같은 값을 낸다', () => {
    // TZ 환경변수와 무관하게 Asia/Seoul로 고정되는지 확인
    const value = '2025-05-14T15:41:09.503';
    expect(formatDisplayDate(value)).toBe('2025. 05. 15.');
    expect(formatDisplayDate(new Date(`${value}Z`))).toBe('2025. 05. 15.');
  });
});

describe('toIsoString', () => {
  it('타임존이 명시된 ISO 문자열을 만든다', () => {
    expect(toIsoString('2025-05-14T15:41:09.503')).toBe(
      '2025-05-14T15:41:09.503Z'
    );
  });
});
