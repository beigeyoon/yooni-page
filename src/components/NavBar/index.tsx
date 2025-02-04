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

export function NavBar() {
  return (
    <NavigationMenu className="flex max-w-none items-center justify-between border-b border-neutral-400 p-4">
      <NavigationMenuList>
        {NAV_MENUS.map((menu, idx) => (
          <NavigationMenuItem key={idx}>
            <Link
              href={menu.path}
              legacyBehavior
              passHref>
              <NavigationMenuLink
                className={buttonVariants({ variant: 'link' })}>
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
