import Link from 'next/link';

export const ADMIN_TABS = [
  { href: '/admin', label: '비공개 글 관리' },
  { href: '/admin/series', label: '시리즈 관리' }
] as const;

export type AdminTabHref = (typeof ADMIN_TABS)[number]['href'];

// 현재 탭만 강조한다. /admin/series/[id]에서는 '/admin/series'를 current로 넘긴다.
export default function AdminNav({ current }: { current: AdminTabHref }) {
  return (
    <nav
      aria-label="관리자 메뉴"
      className="flex gap-2 pb-3">
      {ADMIN_TABS.map(tab => {
        const isCurrent = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={
              isCurrent
                ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100'
            }>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
