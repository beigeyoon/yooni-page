'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList
} from '@/components/ui/navigation-menu';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { buttonVariants } from '../ui/button';
import AuthStatus from './AuthStatus';
import { NAV_MENUS } from '@/constants';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '../ui/sheet';
import { DialogDescription, DialogTitle } from '../ui/dialog';
import Image from 'next/image';

export function NavBar() {
  const pathname = usePathname();
  const activeMenu = '/' + pathname.split('/')[1] || '';
  const mobile_NAV_MENUS = NAV_MENUS.slice(0, -1);

  return (
    <NavigationMenu className="sticky top-0 z-50 flex max-w-none items-center justify-between border-b border-neutral-400 bg-white/80 px-4 py-2 backdrop-blur max-sm:w-full max-sm:border-neutral-300">
      <NavigationMenuList>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="mx-2 max-sm:flex max-sm:items-center">
                <Image
                  src="/images/yooni-favicon.png"
                  alt="main-logo"
                  height={38}
                  width={38}
                  className="min-h-[38px] min-w-[38px] hover:opacity-50 max-sm:mr-3 max-sm:inline-block"
                />
                <span className="text-md font-bold leading-none sm:hidden">
                  Yooni
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              className="bg-violet-500 p-2 max-sm:hidden"
              side="right"
              sideOffset={6}>
              <div className="text-center text-4xl">🔮</div>
              <span className="text-xs">Hakunamatata!</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
              {mobile_NAV_MENUS.map((menu, idx) => (
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
