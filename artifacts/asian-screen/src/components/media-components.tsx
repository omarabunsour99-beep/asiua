import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react';
import { Link } from 'wouter';
import type { Title } from '@/lib/data';
import { readStored, toggleStored } from '@/lib/store';

type ToastHandler = (message: string) => void;
export const statusLabel = (status: Title['status']) => status === 'Upcoming' ? 'قريباً' : status === 'Ongoing' ? 'يبث حالياً' : 'مكتمل';

function useWatchlist() {
  const [ids, setIds] = useState<string[]>(() => readStored('asian-watchlist', []));
  useEffect(() => {
    const sync = () => setIds(readStored('asian-watchlist', []));
    window.addEventListener('asian-store-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('asian-store-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return [ids, (id: string) => setIds(toggleStored('asian-watchlist', id))] as const;
}

export function PosterCard({ item, compact = false, onToast }: { item: Title; compact?: boolean; onToast: ToastHandler }) {
  const [watchlist, toggleWatchlist] = useWatchlist();
  const saved = watchlist.includes(item.id);
  const quickAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    toggleWatchlist(item.id);
    onToast(saved ? 'أُزيل من قائمتك' : 'أُضيف إلى قائمتك');
  };
  return (
    <article data-testid={`card-title-${item.id}`} className={`group min-w-0 ${compact ? 'w-[142px] sm:w-[164px]' : 'w-full'}`}>
      <div className="relative">
        <Link href={`/${item.type}/${item.id}`} data-testid={`link-title-${item.id}`} className="poster-sheen block aspect-[2/3] overflow-hidden bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <img src={item.poster} alt={`ملصق ${item.title}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]" />
          <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-3 pt-14 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white"><Play size={11} fill="currentColor" /> شاهد الآن</span>
          </span>
        </Link>
        <button onClick={quickAdd} data-testid={`button-watchlist-${item.id}`} aria-label={saved ? `إزالة ${item.title} من قائمة المشاهدة` : `إضافة ${item.title} إلى قائمة المشاهدة`} className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/55 text-white opacity-0 backdrop-blur-sm transition hover:bg-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100">
          {saved ? <Check size={15} /> : <Plus size={15} />}
        </button>
      </div>
      <Link href={`/${item.type}/${item.id}`} data-testid={`link-card-caption-${item.id}`} className="block pt-3 focus-visible:outline-none">
        <h3 className="truncate text-[13px] font-semibold text-foreground">{item.title}</h3>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.originalTitle}</p>
        <p className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground"><span>{item.year}</span><span className="text-accent">★ {item.rating}</span><span>{item.country}</span></p>
      </Link>
    </article>
  );
}

export function MediaRow({ title, items, eyebrow = 'اختيارات آسيوية', onToast, href }: { title: string; items: Title[]; eyebrow?: string; onToast: ToastHandler; href?: string }) {
  const [offset, setOffset] = useState(0);
  const shown = items.slice(offset, offset + 7);
  const canBack = offset > 0;
  const canNext = offset + 7 < items.length;
  if (!items.length) return null;
  return (
    <section className="mt-14" data-testid={`section-row-${title}`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono-ui text-[10px] tracking-[.18em] text-primary">{eyebrow}</p>
          <h2 className="font-display text-2xl text-foreground md:text-3xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {href && <Link href={href} data-testid={`link-see-all-${title}`} className="hidden text-[11px] font-semibold text-muted-foreground transition hover:text-primary sm:block">شاهد الكل</Link>}
          <button type="button" disabled={!canBack} onClick={() => setOffset(Math.max(0, offset - 1))} data-testid={`button-row-prev-${title}`} aria-label="العناصر السابقة" className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={16} /></button>
          <button type="button" disabled={!canNext} onClick={() => setOffset(offset + 1)} data-testid={`button-row-next-${title}`} aria-label="العناصر التالية" className="grid h-8 w-8 place-items-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={16} /></button>
        </div>
      </div>
        <div className="scrollbar-hidden grid grid-cols-2 gap-4 pb-2 md:grid-cols-5 md:gap-5 lg:grid-cols-6 xl:grid-cols-7">
        {shown.map(item => <PosterCard key={item.id} item={item} compact onToast={onToast} />)}
      </div>
      {href && <Link href={href} data-testid={`link-see-all-mobile-${title}`} className="mt-3 inline-flex text-[11px] font-semibold text-primary sm:hidden">شاهد الكل ←</Link>}
    </section>
  );
}

export function FeaturedCarousel({ items }: { items: Title[] }) {
  const safeItems = useMemo(() => items.slice(0, 8), [items]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || safeItems.length < 2) return;
    const timer = window.setInterval(() => setActive(value => (value + 1) % safeItems.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, safeItems.length]);
  if (!safeItems.length) return null;
  const current = safeItems[active];
  const rail = [0, 1, 2, 3, 4].map(step => safeItems[(active + step) % safeItems.length]);
  const move = (delta: number) => setActive((active + delta + safeItems.length) % safeItems.length);
  return (
    <section className="featured-stage relative -mx-5 overflow-hidden border-b border-border lg:-mx-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} data-testid="featured-carousel">
      <img src={current.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/.88)_35%,hsl(var(--background)/.28)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,hsl(var(--background))_0%,transparent_55%)]" />
      <div className="relative mx-auto grid min-h-[620px] max-w-[1500px] items-end gap-10 px-5 pb-10 pt-20 lg:grid-cols-[minmax(270px,420px)_1fr] lg:px-10 lg:pb-12">
        <div className="max-w-xl" dir="rtl">
          <p className="mb-4 flex items-center gap-3 font-mono-ui text-[10px] tracking-[.2em] text-primary"><span className="h-px w-8 bg-primary" />اختيار الليلة</p>
          <h1 data-testid="text-featured-title" className="font-display text-4xl leading-[1.08] text-foreground sm:text-6xl lg:text-7xl">{current.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{current.originalTitle}</p>
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">{current.description}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span className="text-accent">★ {current.rating}</span><span>{current.year}</span><span>{current.country}</span><span>{statusLabel(current.status)}</span></div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/watch/${current.id}`} data-testid="link-hero-watch" className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"><Play size={15} fill="currentColor" /> شاهد الآن</Link>
            <Link href={`/${current.type}/${current.id}`} data-testid="link-hero-details" className="inline-flex items-center gap-2 rounded-sm border border-border bg-background/35 px-5 py-3 text-xs font-bold text-foreground backdrop-blur-sm transition hover:border-primary"><span>التفاصيل</span><ChevronLeft size={15} /></Link>
          </div>
        </div>
        <div className="min-w-0" dir="rtl">
          <div className="flex gap-3 overflow-hidden sm:gap-4">
            {rail.map((item, index) => (
              <button type="button" key={`${item.id}-${index}`} onClick={() => setActive(safeItems.indexOf(item))} data-testid={`button-featured-${item.id}`} aria-label={`عرض ${item.title}`} className={`featured-poster shrink-0 overflow-hidden border text-right transition ${index === 0 ? 'featured-poster-active border-primary' : 'border-border/70 opacity-70 hover:opacity-100'}`}>
                <img src={item.poster} alt={`ملصق ${item.title}`} loading={index > 1 ? 'lazy' : 'eager'} className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8 text-[10px] font-semibold text-white">{item.title}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5" aria-label="صفحات الاختيارات">
              {safeItems.map((item, index) => <button type="button" key={item.id} onClick={() => setActive(index)} data-testid={`button-featured-dot-${index}`} aria-label={`الاختيار ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-7 bg-primary' : 'w-1.5 bg-muted-foreground/50'}`} />)}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => move(1)} data-testid="button-featured-next" aria-label="الاختيار التالي" className="grid h-9 w-9 place-items-center border border-border bg-background/50 text-foreground hover:border-primary"><ChevronRight size={17} /></button>
              <button type="button" onClick={() => move(-1)} data-testid="button-featured-prev" aria-label="الاختيار السابق" className="grid h-9 w-9 place-items-center border border-border bg-background/50 text-foreground hover:border-primary"><ChevronLeft size={17} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EpisodePanels({ korean, asian }: { korean: Title[]; asian: Title[] }) {
  const panel = (title: string, items: Title[], testId: string) => {
    const [featured, ...rest] = items;
    if (!featured) return null;
    return (
      <section className="episode-panel" data-testid={testId} dir="rtl">
        <div className="flex items-center justify-between gap-3"><div><p className="font-mono-ui text-[10px] tracking-[.18em] text-primary">إضافة حديثة</p><h2 className="mt-1 font-display text-2xl">{title}</h2></div><Link href="/series" data-testid={`link-episodes-all-${testId}`} className="text-[11px] font-semibold text-muted-foreground hover:text-primary">شاهد الكل</Link></div>
        <Link href={`/watch/${featured.id}?episode=1`} data-testid={`link-featured-episode-${featured.id}`} className="mt-5 flex gap-4 border border-border/70 bg-secondary/40 p-3 transition hover:border-primary/70">
          <img src={featured.poster} alt={`ملصق ${featured.title}`} loading="lazy" className="h-28 w-20 object-cover" />
          <span className="min-w-0 self-center"><span className="block text-[10px] text-accent">الحلقة 01 · {statusLabel(featured.status)}</span><strong className="mt-2 block truncate text-sm">{featured.title}</strong><span className="mt-1 block truncate text-[11px] text-muted-foreground">{featured.originalTitle}</span><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-primary"><Play size={11} fill="currentColor" /> تشغيل الحلقة</span></span>
        </Link>
        <div className="mt-3 space-y-1">
          {rest.slice(0, 4).map(item => <Link key={item.id} href={`/watch/${item.id}?episode=1`} data-testid={`row-new-episode-${item.id}`} className="flex items-center gap-3 border-b border-border/60 px-2 py-3 text-xs transition hover:bg-secondary/70"><span className="font-mono-ui text-primary">01</span><span className="min-w-0 flex-1 truncate">{item.title}</span><span className="text-[10px] text-muted-foreground">{item.country}</span><Play size={12} className="text-muted-foreground" /></Link>)}
        </div>
      </section>
    );
  };
  return <div className="mt-12 grid gap-5 lg:grid-cols-2">{panel('الحلقات الكورية الجديدة', korean, 'panel-new-korean')}{panel('حلقات آسيوية جديدة', asian, 'panel-new-asian')}</div>;
}
