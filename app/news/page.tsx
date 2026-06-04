import Link from 'next/link';
import { ArrowRight, Calendar, Newspaper, Percent, Sparkles } from 'lucide-react';
import { TOP_GAME_SEEDS } from '@/lib/top-games';

const featured = TOP_GAME_SEEDS.filter((game) => game.discount_percent > 0).slice(0, 3);

const updates = [
  {
    title: 'Mega Sale event is live',
    tag: 'Sale',
    description: 'Rotating discounts, free drops, and spotlight deals are now grouped into one store event surface.',
    icon: Percent,
  },
  {
    title: 'Discovery rails expanded',
    tag: 'Storefront',
    description: 'Trending, recommended, top seller, and recently played rails now give the homepage a console-store rhythm.',
    icon: Sparkles,
  },
  {
    title: 'Library delivery improved',
    tag: 'Library',
    description: 'Owned games, free claims, and verified download actions are connected from detail pages to the player library.',
    icon: Calendar,
  },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <section className="border-b border-white/10 bg-[#080a12]">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3b82f6]/15 text-[#3b82f6]">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b82f6]">News</p>
              <h1 className="text-3xl font-black sm:text-4xl">Store updates and events</h1>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {updates.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-xl border border-white/10 bg-[#0B0F19] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-white/70">{item.tag}</span>
                  <Icon className="h-5 w-5 text-[#3b82f6]" />
                </div>
                <h2 className="text-xl font-bold">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#a0a0a0]">{item.description}</p>
              </article>
            );
          })}
        </div>

        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Sale spotlights</h2>
            <Link href="/games?discount=true" className="store-link inline-flex items-center gap-1.5">
              View deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((game, index) => (
              <Link key={`${game.id}-${game.slug}-${index}`} href={`/games/${game.slug}`} className="group overflow-hidden rounded-xl border border-white/10 bg-[#0B0F19]">
                <div className="relative aspect-video overflow-hidden">
                  <img src={game.banner_image || game.cover_image} alt="" className="h-full w-full bg-black object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-lg bg-[#3b82f6] px-2.5 py-1 text-xs font-black text-white">
                    -{game.discount_percent}%
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 font-bold group-hover:text-[#3b82f6]">{game.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#a0a0a0]">{game.short_description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
