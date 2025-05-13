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
import { Shell, Menu } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '../ui/sheet';
import { DialogDescription, DialogTitle } from '../ui/dialog';

export function NavBar() {
  const pathname = usePathname();
  const activeMenu = '/' + pathname.split('/')[1] || '';

  return (
    <NavigationMenu className="sticky top-0 z-50 flex max-w-none items-center justify-between border-b border-neutral-400 bg-white/80 p-4 backdrop-blur max-sm:w-full max-sm:border-neutral-300">
      <NavigationMenuList>
        <Link
          href="/"
          className="mx-2 max-sm:flex max-sm:items-center">
          <Shell
            size={28}
            className="text-zinc-600 hover:text-zinc-400 max-sm:mr-3 max-sm:inline-block"
          />
          <span className="text-md font-bold leading-none sm:hidden">
            Yooni
          </span>
        </Link>
        {/* 데스크탑 메뉴 */}
        {NAV_MENUS.map((menu, idx) => (
          <NavigationMenuItem
            key={idx}
            className="max-sm:hidden">
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
      <div className="max-sm:hidden">
        <AuthStatus />
      </div>

      {/* 모바일 메뉴 */}
      <div className="flex justify-center sm:hidden">
        <Sheet>
          <SheetTrigger>
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-64 flex-col items-center justify-between">
            <DialogTitle className="hidden" />
            <DialogDescription className="hidden" />
            <NavigationMenuList className="mt-8 flex flex-col gap-4 font-medium">
              {NAV_MENUS.map((menu, idx) => (
                <NavigationMenuItem key={idx}>
                  <Link
                    href={menu.path}
                    legacyBehavior
                    passHref>
                    <NavigationMenuLink>
                      <SheetClose>{menu.title}</SheetClose>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
            <AuthStatus />
          </SheetContent>
        </Sheet>
      </div>
    </NavigationMenu>
  );
}
