'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdHome, MdRestaurant, MdList, MdSettings } from 'react-icons/md';
import { MyColors } from '@/types/colors';

const tabs = [
  { href: '/dashboard', label: 'Inicio', Icon: MdHome },
  { href: '/meals', label: 'Comidas', Icon: MdRestaurant },
  { href: '/ingredients', label: 'Ingredientes', Icon: MdList },
  { href: '/settings', label: 'Config', Icon: MdSettings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-alternate/20 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-xl flex">
      {tabs.map(({ href, label, Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-3"
          >
            <Icon size={24} color={isActive ? MyColors.ACCENT : MyColors.PRIMARY} />
            <span className={`text-xs ${isActive ? 'text-accent' : 'text-primary'}`}>
              {label}
            </span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
