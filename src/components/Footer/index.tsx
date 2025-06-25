'use client';

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-gray-400 bg-white py-5">
      <div className="mx-auto max-w-screen-xl px-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Yooni Blog. All rights reserved.
        <br />
        Contact:{' '}
        <a
          href="mailto:yooni.dev@gmail.com"
          className="font-bold hover:underline">
          beige.yoon@gmail.com
        </a>
      </div>
    </footer>
  );
}
