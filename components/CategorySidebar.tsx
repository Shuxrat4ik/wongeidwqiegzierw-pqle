'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, Gamepad2, Zap, Gift, TrendingUp, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode;
  count?: number;
  subcategories?: Category[];
}

const categories: Category[] = [
  {
    id: 'all',
    name: 'All Games',
    icon: <Gamepad2 className="w-4 h-4" />,
  },
  {
    id: 'action',
    name: 'Action',
    count: 245,
  },
  {
    id: 'adventure',
    name: 'Adventure',
    count: 189,
  },
  {
    id: 'rpg',
    name: 'Role-Playing',
    count: 156,
  },
  {
    id: 'strategy',
    name: 'Strategy',
    count: 98,
  },
  {
    id: 'simulation',
    name: 'Simulation',
    count: 87,
  },
  {
    id: 'sports',
    name: 'Sports',
    count: 64,
  },
  {
    id: 'racing',
    name: 'Racing',
    count: 45,
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    count: 52,
  },
  {
    id: 'horror',
    name: 'Horror',
    count: 38,
  },
];

const quickLinks: Category[] = [
  {
    id: 'free',
    name: 'Free to Play',
    icon: <Gift className="w-4 h-4" />,
  },
  {
    id: 'deals',
    name: 'Deals',
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: 'trending',
    name: 'Trending',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: 'top-rated',
    name: 'Top Rated',
    icon: <Star className="w-4 h-4" />,
  },
  {
    id: 'new-releases',
    name: 'New Releases',
    icon: <Clock className="w-4 h-4" />,
  },
];

interface CategorySidebarProps {
  className?: string;
}

export default function CategorySidebar({ className }: CategorySidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  return (
    <aside className={cn('w-64 shrink-0 border-r border-[#3a3a3a] bg-[#121212] p-4 hidden lg:block', className)}>
      <div className="space-y-6">
        {/* Quick Links */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9e9e9e] mb-3">Quick Links</h3>
          <ul className="space-y-1">
            {quickLinks.map((link) => (
              <li key={link.id}>
                <QuickLink link={link} isActive={pathname === '/games' && categoryParam === link.id} />
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9e9e9e] mb-3">Categories</h3>
          <ul className="space-y-0.5">
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryLink category={category} isActive={categoryParam === category.id} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

function QuickLink({ link, isActive }: { link: Category; isActive: boolean }) {
  const href = link.id === 'all' ? '/games' : `/games?category=${link.id}`;
  
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-[#0078f4] text-white'
          : 'text-[#9e9e9e] hover:text-white hover:bg-[#1f1f1f]'
      )}
    >
      {link.icon}
      {link.name}
    </Link>
  );
}

function CategoryLink({ category, isActive }: { category: Category; isActive: boolean }) {
  const href = category.id === 'all' ? '/games' : `/games?category=${category.id}`;
  
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group',
        isActive
          ? 'bg-[#1f1f1f] text-white'
          : 'text-[#9e9e9e] hover:text-white hover:bg-[#1f1f1f]'
      )}
    >
      <span>{category.name}</span>
      <div className="flex items-center gap-2">
        {category.count && (
          <span className="text-xs text-[#757575] group-hover:text-[#9e9e9e]">{category.count}</span>
        )}
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}
