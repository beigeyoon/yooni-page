'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from '@/components/ui/navigation-menu';
import { buttonVariants } from '../ui/button';
import AuthStatus from './AuthStatus';
import { NAV_MENUS } from '@/constants';
import { usePathname } from 'next/navigation';
import { Shell } from 'lucide-react';

export function NavBar() {
  const pathname = usePathname();
  const activeMenu = '/' + pathname.split('/')[1] || '';

  return (
    <NavigationMenu className="sticky top-0 z-50 flex max-w-none items-center justify-between border-b border-neutral-400 bg-white/80 p-4 backdrop-blur">
      <NavigationMenuList>
        <Link
          href="/"
          className="mx-2">
          <Shell
            size={28}
            className="text-zinc-600 hover:text-zinc-400"
          />
        </Link>
        {NAV_MENUS.map((menu, idx) => (
          <NavigationMenuItem key={idx}>
            <Link
              href={menu.path}
              legacyBehavior
              passHref>
              <NavigationMenuLink
                className={
                  buttonVariants({ variant: 'link' }) +
                  ` ${menu.path === activeMenu ? 'underline' : ''}`
                }>
                {menu.title}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
      <AuthStatus />
    </NavigationMenu>
  );
}
