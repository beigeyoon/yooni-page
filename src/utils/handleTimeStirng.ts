import { formatDisplayDate } from './dbTimestamp';

// DB 타임스탬프는 타임존 표시 없이 오고 값은 UTC다. 자세한 내용은 dbTimestamp.ts 참고.
// 표시는 항상 한국 시간 기준이라 서버와 브라우저가 같은 값을 낸다.
function handleTimeStirng(dateString: string): string {
  return formatDisplayDate(dateString);
}

export default handleTimeStirng;
