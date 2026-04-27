import Link from 'next/link';
import AdminPostsManager from '@/components/Admin/AdminPostsManager';

const ADMIN_TABS = [
  {
    href: '/admin',
    label: '비공개 글 관리',
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6 py-8 max-sm:px-4">
      <nav
        aria-label="관리자 메뉴"
        className="flex gap-2 pb-3"
      >
        {ADMIN_TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <AdminPostsManager />
    </div>
  );
}
