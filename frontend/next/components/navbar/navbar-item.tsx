'use client';

import { Link } from 'next-view-transitions';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Props = {
  href: never;
  children: ReactNode;
  active?: boolean;
  className?: string;
  target?: string;
};

export function NavbarItem({
  children,
  href,
  active,
  target,
  className,
}: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-center text-sm leading-[110%] px-4 py-2 rounded-md transition duration-200',
        'text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900',
        'dark:text-white dark:hover:bg-neutral-800 dark:hover:text-white/80',
        (active || pathname?.includes(href)) && 'bg-transparent',
        className
      )}
      target={target}
    >
      {children}
    </Link>
  );
}
