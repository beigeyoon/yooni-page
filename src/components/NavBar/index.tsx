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

export function NavBar() {
  return (
    <NavigationMenu className="flex max-w-none items-center justify-between border-b border-neutral-400 p-4">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link
            href="/about"
            legacyBehavior
            passHref>
            <NavigationMenuLink className={buttonVariants({ variant: 'link' })}>
              About
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href="/projects"
            legacyBehavior
            passHref>
            <NavigationMenuLink className={buttonVariants({ variant: 'link' })}>
              Projects
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href="/travels"
            legacyBehavior
            passHref>
            <NavigationMenuLink className={buttonVariants({ variant: 'link' })}>
              Travels
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href="/devs"
            legacyBehavior
            passHref>
            <NavigationMenuLink className={buttonVariants({ variant: 'link' })}>
              Devs
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href="/photos"
            legacyBehavior
            passHref>
            <NavigationMenuLink className={buttonVariants({ variant: 'link' })}>
              Photos
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
      <AuthStatus />
    </NavigationMenu>
  );
}
