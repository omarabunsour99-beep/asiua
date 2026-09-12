import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowUp, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Film, Heart, Pencil, Play, Plus, Search, Settings, SlidersHorizontal, Sparkles, Trash2, UserRound, X } from 'lucide-react';
import type { Country, Title, TitleType } from '@/lib/data';
import { COUNTRIES } from '@/lib/catalogue-constants';
import { readStored, toggleStored, useStored } from '@/lib/store';
import SiteHeader from '@/components/site-header';
import { EpisodePanels, FeaturedCarousel, MediaRow, PosterCard, statusLabel } from '@/components/media-components';
import { DramaListingPage } from '@/components/drama-listing';
import { AdminConsole } from '@/components/admin-console';
import { getPublicTitle, toLegacyTitle, usePublicTitles } from '@/lib/api';

type Sort = 'popularity' | 'rating' | 'newest' | 'alpha';

function useIds(key: string) {
  const [ids, setIds] = useState<string[]>(() => readStored(key, []));
  useEffect(() => {
    const sync = () => setIds(readStored(key, []));
    window.addEventListener('asian-store-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('asian-store-change', sync); window.removeEventListener('storage', sync); };
  }, [key]);
  const toggle = (id: string) => setIds(toggleStored(key, id));
  return [ids, toggle] as const;
}

function Meta({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} — Asian Screen`;
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let node = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attr, name); document.head.appendChild(node); }
      node.setAttribute('content', content);
    };
    setMeta('description', description);
    setMeta('og:title', `${title} — Asian Screen`, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
  }, [title, description]);
  return null;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 3000); return () => window.clearTimeout(timer); }, [onClose]);
  return <div data-testid="toast-message" className="fixed right-4 top-20 z-40 flex items-center gap-3 border border-primary/40 bg-card/95 px-4 py-3 text-sm shadow-2xl shadow-black/30 backdrop-blur-md page-enter"><Sparkles size={15} className="text-accent" /><span>{message}</span><button aria-label="Dismiss notification" data-testid="button-dismiss-toast" onClick={onClose}><X size={15} /></button></div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    const onScroll = () => setShowTop(window.scrollY > 520);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div dir="rtl" className="film-grain min-h-[100dvh] bg-background">
    <SiteHeader />
    <main className="mx-auto max-w-[1500px] px-5 pb-28 pt-7 lg:px-10 lg:pb-12">{children}</main>
    <Footer />
    {showTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} data-testid="button-back-to-top" aria-label="العودة إلى أعلى الصفحة" className="fixed bottom-20 left-5 z-30 grid h-10 w-10 place-items-center rounded-full border border-primary/50 bg-card/95 text-primary shadow-xl shadow-black/30 backdrop-blur-lg transition hover:bg-primary hover:text-primary-foreground lg:bottom-6"><ArrowUp size={17} /></button>}
    <nav aria-label="التنقل السريع" className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-sidebar/96 py-2 backdrop-blur-xl lg:hidden">{[{href:'/',label:'الرئيسية',test:'home',icon:Sparkles},{href:'/movies',label:'الأفلام',test:'movies',icon:Film},{href:'/search',label:'بحث',test:'search',icon:Search},{href:'/watchlist',label:'قائمتي',test:'watchlist',icon:Bookmark},{href:'/profile',label:'حسابي',test:'profile',icon:UserRound}].map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} data-testid={`link-bottom-${item.test}`} className={`flex flex-col items-center gap-1 text-[9px] font-medium ${isActive(item.href) ? 'text-primary' : 'text-muted-foreground'}`}><Icon size={18} /><span>{item.label}</span></Link>; })}</nav>
  </div>;
}

function Footer() {
  return <footer dir="rtl" className="border-t border-border bg-card/30 px-5 py-10 lg:px-10">
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href="/" data-testid="link-footer-logo" className="text-sm font-bold tracking-[.16em] text-foreground">ASIAN SCREEN</Link><p className="mt-3 max-w-sm text-xs leading-6 text-muted-foreground">رفّك الهادئ للدراما الحية والأفلام الآسيوية. اختر قصة، واترك الشاشة تتكلم.</p></div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><Link href="/series" data-testid="link-footer-series" className="hover:text-primary">الدراما</Link><Link href="/movies" data-testid="link-footer-movies" className="hover:text-primary">الأفلام</Link><Link href="/genres" data-testid="link-footer-genres" className="hover:text-primary">التصنيفات</Link><Link href="/watchlist" data-testid="link-footer-watchlist" className="hover:text-primary">قائمتي</Link><span>© {new Date().getFullYear()} Asian Screen</span></div>
    </div>
  </footer>;
}

function Button({ children, onClick, variant = 'primary', testId, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; variant?: 'primary'|'ghost'|'outline'; testId: string; className?: string; type?: 'button'|'submit' }) {
  const styles = variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : variant === 'outline' ? 'border border-border bg-transparent text-foreground hover:border-primary/70 hover:bg-secondary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground';
  return <button type={type} onClick={onClick} data-testid={testId} className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-xs font-semibold uppercase tracking-[.12em] transition ${styles} ${className}`}>{children}</button>;
}

function Row(props: { title: string; items: Title[]; eyebrow?: string; onToast: (msg: string) => void; href?: string }) {
  return <MediaRow {...props} />;
}


function Home() {
  const [toast, setToast] = useState('');
  const remote = usePublicTitles({ page: 1, pageSize: 100 });
  const all = remote.items.map(toLegacyTitle);
  const korean = all.filter(item => item.country === 'Korea' && item.type === 'series').sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  const asian = all.filter(item => item.type === 'series').sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  const series = (country: Title['country']) => all.filter(item => item.country === country && item.type === 'series').sort((a, b) => b.popularity - a.popularity);
  if (remote.loading) return <Shell><div data-testid="home-loading" className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">جارٍ تحميل الكتالوج…</div></Shell>;
  if (remote.error) return <Shell><EmptyState title="تعذر تحميل الكتالوج" description="حدثت مشكلة مؤقتة في الاتصال بقاعدة البيانات." href="/" label="إعادة المحاولة" /></Shell>;
  return <Shell><Meta title="اكتشف قصتك القادمة" description="Asian Screen منصة اكتشاف للدراما الحية والأفلام الآسيوية من كوريا والصين واليابان وتايلاند وتايوان." /><div className="page-enter">
    <FeaturedCarousel items={[...all].sort((a, b) => b.popularity - a.popularity)} />
    <div className="mx-auto max-w-[1160px]">
      <div className="mt-12 grid gap-5 border-y border-border py-8 md:grid-cols-[1.15fr_1fr] md:items-end"><div><p className="font-mono-ui text-[10px] tracking-[.18em] text-accent">ASIAN SCREEN / وجهتك للمسلسلات والأفلام الآسيوية</p><p className="mt-3 max-w-2xl font-display text-2xl leading-relaxed text-foreground md:text-3xl">أفضل المسلسلات والأفلام الآسيوية في مكان واحد</p></div><p className="text-sm leading-7 text-muted-foreground">كل ما تحبه من الدراما والسينما الآسيوية</p></div>
      <EpisodePanels korean={korean} asian={asian} />
       <MediaRow title="أضيفت مؤخراً" items={[...all].sort((a, b) => b.year - a.year)} eyebrow="على الرف الآن" onToast={setToast} />
       <MediaRow title="الأفلام الآسيوية" items={all.filter(item => item.type === 'movie')} onToast={setToast} href="/movies" />
      <MediaRow title="الدراما الكورية" items={series('Korea')} onToast={setToast} href="/country/korea" />
       <MediaRow title="الدراما الصينية والتايوانية" items={all.filter(item => item.type === 'series' && (item.country === 'China' || item.country === 'Taiwan')).sort((a, b) => b.popularity - a.popularity)} onToast={setToast} href="/country/china" />
      <MediaRow title="الدراما اليابانية" items={series('Japan')} onToast={setToast} href="/country/japan" />
      <MediaRow title="الدراما التايلاندية" items={series('Thailand')} onToast={setToast} href="/country/thailand" />
       {all.some(item => item.status === 'Ongoing') && <MediaRow title="يعرض حالياً" items={all.filter(item => item.status === 'Ongoing')} onToast={setToast} />}
    </div>
  </div>{toast && <Toast message={toast} onClose={() => setToast('')} />}</Shell>;
}

function NewEpisodesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const remote = usePublicTitles({ type: 'series', page: 1, pageSize: 100 });
  const sorted = remote.items.map(toLegacyTitle).sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const items = sorted.slice((page - 1) * pageSize, page * pageSize);
  if (remote.loading) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل الحلقات…</div></Shell>;
  if (remote.error) return <Shell><EmptyState title="تعذر تحميل الحلقات" description="حاول مرة أخرى بعد قليل." href="/episodes" label="إعادة المحاولة" /></Shell>;
  return <Shell><Meta title="الحلقات الجديدة" description="تابع أحدث حلقات الدراما الآسيوية الحية على Asian Screen." /><div className="page-enter">
    <div className="border-b border-border pb-8"><p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">ASIAN SCREEN / تحديثات اليوم</p><h1 className="mt-3 font-display text-4xl md:text-6xl">الحلقات الجديدة</h1><p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">آخر الإضافات من الدراما الكورية والصينية واليابانية والتايلاندية والتايوانية، في مكان واحد.</p></div>
    <div data-testid="grid-new-episodes" className="stagger mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{items.map(item => <div key={item.id} className="min-w-0"><PosterCard item={item} onToast={() => undefined} /><Link href={`/watch/${item.id}?episode=1`} data-testid={`link-new-episode-watch-${item.id}`} className="mt-3 flex items-center justify-between border border-border px-3 py-2 text-[10px] font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"><span>الحلقة 01 · {statusLabel(item.status)}</span><Play size={12} /></Link></div>)}</div>
    <div className="mt-10 flex items-center justify-center gap-2" dir="rtl" aria-label="صفحات الحلقات"><button type="button" disabled={page === 1} onClick={() => setPage(value => Math.max(1, value - 1))} data-testid="button-episodes-previous" aria-label="الصفحة السابقة" className="grid h-9 w-9 place-items-center border border-border text-muted-foreground hover:border-primary disabled:opacity-30"><ChevronRight size={15} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map(value => <button type="button" key={value} onClick={() => setPage(value)} data-testid={`button-episodes-page-${value}`} aria-label={`الصفحة ${value}`} className={`grid h-9 w-9 place-items-center border text-xs ${page === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary'}`}>{value}</button>)}<button type="button" disabled={page === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))} data-testid="button-episodes-next" aria-label="الصفحة التالية" className="grid h-9 w-9 place-items-center border border-border text-muted-foreground hover:border-primary disabled:opacity-30"><ChevronLeft size={15} /></button></div>
  </div></Shell>;
}

function FilterBar({ type, country, genre, genreOptions, year, rating, sort, onChange }: { type: TitleType|'all'; country: string; genre: string; genreOptions: string[]; year: string; rating: string; sort: Sort; onChange: (key: string, value: string) => void }) {
  return <div className="grid gap-2 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-6"><div className="relative sm:col-span-2 lg:col-span-2"><SlidersHorizontal size={15} className="pointer-events-none absolute right-3 top-3 text-muted-foreground" /><select data-testid="select-country-filter" value={country} onChange={e=>onChange('country',e.target.value)} className="h-10 w-full appearance-none rounded-sm border border-border bg-secondary pl-3 pr-9 text-xs outline-none"><option value="">كل البلدان</option>{COUNTRIES.map(c=><option key={c} value={c}>{c === 'Korea' ? 'كوريا الجنوبية' : c === 'China' ? 'الصين' : c === 'Japan' ? 'اليابان' : c === 'Thailand' ? 'تايلاند' : c === 'Taiwan' ? 'تايوان' : c}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /></div><select data-testid="select-genre-filter" value={genre} onChange={e=>onChange('genre',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="">كل التصنيفات</option>{genreOptions.map(g=><option key={g} value={g}>{genreLabels[g] || g}</option>)}</select><select data-testid="select-year-filter" value={year} onChange={e=>onChange('year',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="">كل السنوات</option>{[2024,2023,2022,2021,2020,2019,2018,2017,2016].map(y=><option key={y} value={y}>{y}</option>)}</select><select data-testid="select-rating-filter" value={rating} onChange={e=>onChange('rating',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="">كل التقييمات</option><option value="8.5">8.5+</option><option value="8">8.0+</option><option value="7.5">7.5+</option></select><select data-testid="select-sort" value={sort} onChange={e=>onChange('sort',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="popularity">الأكثر شعبية</option><option value="rating">الأعلى تقييماً</option><option value="newest">الأحدث</option><option value="alpha">أبجدياً</option></select></div>;
}

function Catalog({ type }: { type: TitleType }) {
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({country:'',genre:'',year:'',rating:'',sort:'popularity' as Sort});
  const remote = usePublicTitles({ type, q: query, country: filters.country, genre: filters.genre, year: filters.year, page: 1, pageSize: 100 });
  const source = remote.items.map(toLegacyTitle);
  const genreOptions = Array.from(new Set(remote.items.flatMap(item => item.genres))).sort();
  const filtered = useMemo(() => {
    const result = source.filter(t => (!filters.rating || t.rating >= Number(filters.rating)));
    return result.sort((a,b) => filters.sort === 'rating' ? b.rating-a.rating : filters.sort === 'newest' ? b.year-a.year : filters.sort === 'alpha' ? a.title.localeCompare(b.title) : b.popularity-a.popularity);
  }, [source, filters]);
  const change = (key: string, value: string) => setFilters(prev => ({...prev, [key]: value}));
  if (remote.loading) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل الكتالوج…</div></Shell>;
  if (remote.error) return <Shell><EmptyState title="تعذر تحميل الكتالوج" description="حاول مرة أخرى بعد قليل." href={`/${type === 'movie' ? 'movies' : 'series'}`} label="إعادة المحاولة" /></Shell>;
  return <Shell><Meta title={`${type === 'movie' ? 'Movies' : 'Dramas'} / Explore`} description={`Explore curated Asian ${type === 'movie' ? 'movies' : 'live-action dramas'} by country, genre and year.`} /><div className="page-enter"><div className="flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">الكتالوج / {type === 'movie' ? '01' : '02'}</p><h1 className="mt-3 font-display text-5xl italic md:text-7xl">{type === 'movie' ? 'أفلام آسيوية' : 'دراما تستحق السهر'}</h1></div><div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={16} /><input data-testid={`input-${type}-catalog-search`} value={query} onChange={e=>setQuery(e.target.value)} placeholder={`ابحث عن ${type === 'movie' ? 'الأفلام' : 'المسلسلات'}...`} className="h-10 w-full rounded-sm border border-border bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary" /></div></div><div className="mt-7"><FilterBar type={type} country={filters.country} genre={filters.genre} genreOptions={genreOptions} year={filters.year} rating={filters.rating} sort={filters.sort} onChange={change} /></div><div className="mt-8 flex items-center justify-between text-xs text-muted-foreground"><span data-testid="text-results-count">{filtered.length} عمل</span>{filtered.length === 0 && <span>جرّب تخفيف بعض الفلاتر</span>}</div>{filtered.length ? <div className="stagger mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">{filtered.map(item=><PosterCard key={item.id} item={item} onToast={setToast} />)}</div> : <EmptyState title="لا توجد أعمال هنا" description="جرّب بلدًا أو تصنيفًا أو سنة أخرى" href={type === 'movie' ? 'تصفح المسلسلات' : 'تصفح الأفلام'} label={type === 'movie' ? 'Browse dramas' : 'Browse movies'} />}</div>{toast && <Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

  function CountryPage({ country }: { country: Country | 'ChinaTaiwan' }) {
  const [toast, setToast] = useState('');
  const [genre, setGenre] = useState('');
    const remote = usePublicTitles({
      country: country === 'ChinaTaiwan' ? undefined : country,
      page: 1,
      pageSize: 100,
    });
    const list = remote.items
    .map(toLegacyTitle)
    .filter(t =>
      (country !== 'ChinaTaiwan' || t.country === 'China' || t.country === 'Taiwan') &&
      (!genre || t.genres.includes(genre))
    );
  const featured = list[0];
  const genreOptions = Array.from(new Set(remote.items.flatMap(item => item.genres))).sort();
  if (remote.loading) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل عناوين {country}…</div></Shell>;
  if (remote.error || !featured) return <Shell><EmptyState title={`لا توجد عناوين من ${country}`} description="تعذر تحميل هذه المجموعة حالياً." href="/series" label="العودة إلى الدراما" /></Shell>;
  return <Shell><Meta title={`${countryLabels[country] || country} / اكتشاف`} description={`اكتشف أجمل الأفلام والمسلسلات الآسيوية من ${countryLabels[country] || country} على Asian Screen`} /><div className="page-enter"><section className="relative -mx-5 min-h-[430px] overflow-hidden border-b border-border lg:-mx-10"><img src={featured.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" /><div className="relative flex min-h-[430px] max-w-xl flex-col justify-end px-6 pb-12 lg:px-16"><p className="font-mono-ui text-[10px] uppercase tracking-[.3em] text-primary"> عن {country === 'ChinaTaiwan' ? 'الصين وتايوان' : countryLabels[country] || country}</p><h1 className="mt-3 font-display text-6xl italic">{country === 'ChinaTaiwan' ? 'الصين وتايوان' : countryLabels[country] || country}
  <br />
  <span className="text-accent">بعد حلول الظلام</span></h1><p className="mt-4 text-sm leading-6 text-muted-foreground">استكشف أبرز الأعمال التي تتميز بها {country === 'ChinaTaiwan' ? 'الصين وتايوان' : countryLabels[country] || country} حاليًا</p></div></section><div className="mt-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">{['All',...genreOptions].map(g=><button key={g} onClick={()=>setGenre(g==='All'?'':g)} data-testid={`button-country-genre-${g.toLowerCase()}`} className={`whitespace-nowrap border px-3 py-2 text-[10px] uppercase tracking-widest transition ${genre===(g==='All'?'':g) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/60'}`}>{g === 'All' ? 'الكل' : genreLabels[g] || g}</button>)}</div><Row title="أحدث الإضافات" eyebrow="أحدث الأعمال" items={[...list].sort((a,b)=>b.year-a.year)} onToast={setToast} /><Row title="الأكثر شعبية الآن" items={[...list].sort((a,b)=>b.popularity-a.popularity)} onToast={setToast} /><Row title="الأعلى تقييماً" items={[...list].sort((a,b)=>b.rating-a.rating)} onToast={setToast} /><Row title={`أفلام ${countryLabels[country] || country}`} items={list.filter(t=>t.type==='movie')} onToast={setToast} href="/movies" /></div>{toast && <Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function EmptyState({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return <div data-testid="empty-state" className="mx-auto mt-12 max-w-lg border border-dashed border-border px-6 py-14 text-center"><Clock3 className="mx-auto text-accent" size={24} /><h2 className="mt-5 font-display text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><Link href={href} data-testid="link-empty-explore" className="mt-6 inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-semibold hover:border-primary"><ArrowLeft size={14} /> {label}</Link></div>;
}
const genreLabels: Record<string, string> = {
  Action: 'أكشن',
  Adventure: 'مغامرة',
  Comedy: 'كوميدي',
  Crime: 'جريمة',
  Drama: 'دراما',
  Family: 'عائلي',
  Mystery: 'غموض',
  Music: 'موسيقى',
  Period: 'تاريخي',
  Political: 'سياسي',
  Romance: 'رومانسي',
  'Slice of Life': 'حياة يومية',
  Thriller: 'إثارة',
  Urban: 'حضري',
  Melodrama: 'ميلودراما',
};
const countryLabels: Record<string, string> = {
  Korea: 'كوريا الجنوبية',
  China: 'الصين',
  Japan: 'اليابان',
  Thailand: 'تايلاند',
  Taiwan: 'تايوان',
};
function Detail({ type }: { type: TitleType }) {
  const { id } = useParams<{ id: string }>();
  const [remoteDetail, setRemoteDetail] = useState<any>(null);
  const [detailError, setDetailError] = useState(false);
  const allRemote = usePublicTitles({ page: 1, pageSize: 100 });
  useEffect(() => { if (id) void getPublicTitle(id).then(value => { setRemoteDetail(value); setDetailError(false); }).catch(() => setDetailError(true)); }, [id]);
  const item = remoteDetail ? toLegacyTitle(remoteDetail) : undefined;
  const [toast, setToast] = useState('');
  const [watchlist, toggleWatchlist] = useIds('asian-watchlist');
  const [favorites, toggleFavorite] = useIds(type === 'movie' ? 'asian-favorite-movies' : 'asian-favorite-dramas');
  if (!item && !detailError) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل التفاصيل…</div></Shell>;
  if (!item) return <Shell><EmptyState title="A missing reel" description="That title has left the catalogue." href="/" label="Return home" /></Shell>;
  const saved = watchlist.includes(item.id);
  const favorite = favorites.includes(item.id);
  const similar = allRemote.items.map(toLegacyTitle).filter(t=>t.id!==item.id && (t.country===item.country || t.genres.some(g=>item.genres.includes(g)))).slice(0,6);
  const seasons = remoteDetail?.seasons || [];
  const toggle = () => { toggleWatchlist(item.id); setToast(saved ? 'تمت إزالة العمل من قائمتي' : 'تمت إضافة العمل إلى قائمتي'); };
  return <Shell><Meta title={item.title} description={item.description} /><div className="page-enter"><section className="relative -mx-5 min-h-[510px] overflow-hidden border-b border-border lg:-mx-10"><img src={item.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/25" /><div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" /><div className="relative flex min-h-[510px] max-w-2xl flex-col justify-end px-6 pb-12 lg:px-16"><Link href={type==='movie'?'/movies':'/series'} data-testid="link-back-catalog" className="mb-auto mt-4 flex items-center gap-2 self-start text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> العودة إلى القائمة</Link><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">{countryLabels[item.country] || item.country} / {item.type === 'series' ? 'مسلسل' : 'فيلم'} / {item.year}</p><h1 data-testid="text-detail-title" className="mt-3 font-display text-5xl leading-none italic md:text-7xl">{item.title}</h1><p className="mt-2 text-sm italic text-muted-foreground">{item.originalTitle}</p><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{item.description}</p><div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"><span className="text-accent">★ {item.rating}</span><span>{item.year}</span><span>{item.language === 'Korean' ? 'كوريا الجنوبية' : item.language === 'Chinese' ? 'الصين' : item.language === 'Japanese' ? 'اليابان' : item.language === 'Thai' ? 'تايلاند' : item.language === 'Taiwanese' ? 'تايوان' : item.language}</span><span>{item.genres.map((genre) => genreLabels[genre] || genre).join(' · ')}</span></div><div className="mt-7 flex flex-wrap gap-3"><Link href={`/watch/${item.id}`} data-testid="link-detail-watch" className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground"><Play size={15} fill="currentColor" /> شاهد الآن</Link><Button onClick={toggle} variant="outline" testId="button-detail-watchlist">{saved ? <Check size={15} /> : <Plus size={15} />}{saved ? 'في قائمتي' : 'أضف إلى قائمتي'}</Button><Button onClick={()=>{toggleFavorite(item.id); setToast(favorite ? 'تمت إزالة العمل من المفضلة' : 'تمت إضافة العمل إلى المفضلة');}} variant="ghost" testId="button-detail-favorite"><Heart size={16} fill={favorite?'currentColor':'none'} /> المفضلة</Button></div></div></section><div className="grid gap-10 py-10 md:grid-cols-[1fr_280px]"><div><div className="border-b border-border pb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">نظرة أقرب </p><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{item.description} Every frame is a small act of attention, and every performance leaves a different trace after midnight.</p></div>{type==='series' && <div className="mt-8 border-b border-border pb-8"><div className="flex items-center justify-between"><h2 className="font-display text-2xl italic">الحلقات</h2><span className="text-xs text-muted-foreground">{seasons.length} مواسم · {item.episodes} حلقة</span></div>{seasons.length ? seasons.map((season: any) => <div key={season.id} className="mt-4"><p className="mb-2 text-xs text-primary">{season.title || `الموسم ${season.seasonNumber}`}</p><div className="grid gap-2 sm:grid-cols-2">{season.episodes.map((episode: any) => <Link key={episode.id} href={`/watch/${item.id}?episode=${episode.episodeNumber}`} data-testid={`link-episode-${item.id}-${episode.episodeNumber}`} className="flex items-center gap-3 border border-border bg-secondary/40 px-3 py-3 text-sm transition hover:border-primary/60"><span className="font-mono-ui text-xs text-primary">{String(episode.episodeNumber).padStart(2,'0')}</span><span>{episode.title}</span><Play size={13} className="ml-auto text-muted-foreground" /></Link>)}</div></div>) : <p className="mt-4 text-sm text-muted-foreground">لا توجد مواسم أو حلقات بعد.</p>}</div>}</div><aside className="space-y-7"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">التفاصيل</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">المخرج</dt><dd className="text-right">{item.director}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">أبطال الدراما</dt><dd className="max-w-[160px] text-right">{item.cast.join(', ')}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">الحالة</dt><dd className="text-accent">{statusLabel(item.status)}</dd></div></dl></div></aside></div><Row title="You might also like" items={similar} onToast={setToast} /></div>{toast && <Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function getEmbedUrl(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    // =========================
    // OK.RU
    // =========================
    if (host === "ok.ru" || host === "www.ok.ru") {
      const match = url.pathname.match(
        /\/video\/(?:embed\/)?(\d+)/
      );

      if (match?.[1]) {
        return `https://ok.ru/videoembed/${match[1]}`;
      }
    }

    // =========================
    // YOUTUBE
    // =========================
    if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com"
    ) {
      // Already an embed URL
      if (url.pathname.startsWith("/embed/")) {
        return value;
      }

      const videoId = url.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${encodeURIComponent(
          videoId
        )}`;
      }
    }

    // YouTube short URL
    if (host === "youtu.be") {
      const videoId = url.pathname
        .replace(/^\//, "")
        .split("/")[0];

      if (videoId) {
        return `https://www.youtube.com/embed/${encodeURIComponent(
          videoId
        )}`;
      }
    }

    // =========================
    // VIMEO
    // =========================
    if (
      host === "vimeo.com" ||
      host === "www.vimeo.com"
    ) {
      const match = url.pathname.match(/\/(\d+)/);

      if (match?.[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }

    // =========================
    // OTHER EMBED / DIRECT URL
    // =========================
    return value;
  } catch {
    return null;
  }
}


    function Watch({ item }: { item: Title | undefined }) {
      const { id } = useParams<{ id: string }>();
      const [location, navigate] = useLocation();

      const allRemote = usePublicTitles({ page: 1, pageSize: 100 });

      const [remoteDetail, setRemoteDetail] = useState<any>(null);
      const [watchError, setWatchError] = useState(false);

      const [selectedWatchLinkId, setSelectedWatchLinkId] =
        useState<string | null>(null);

      const [progress, setProgress] = useStored<Record<string, number>>(
        "asian-progress",
        {}
      );

      const [watchlist, toggleWatchlist] =
        useIds("asian-watchlist");

      const [season, setSeason] = useState(1);

      /*
       * Read episode directly from the current URL.
       * This makes /watch/id?episode=2 immediately represent episode 2.
       */
      const getEpisodeFromUrl = () => {
        if (typeof window === "undefined") {
          return 1;
        }

    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get("episode"));

    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }

    return value;
  };

  const getSeasonFromUrl = () => {
    if (typeof window === "undefined") {
      return 1;
    }

    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get("season"));

    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }

    return value;
  };

  const [episodeNumber, setEpisodeNumber] =
    useState<number>(getEpisodeFromUrl());

  /*
   * Load the real title from the backend.
   */
  useEffect(() => {
    if (!id) return;

    void getPublicTitle(id)
      .then((value) => {
        setRemoteDetail(value);
        setWatchError(false);
      })
      .catch(() => {
        setWatchError(true);
      });
  }, [id]);

  /*
   * IMPORTANT:
   * When Wouter changes the URL from:
   *
   * ?episode=1
   *
   * to:
   *
   * ?episode=2
   *
   * update React state as well.
   */
  useEffect(() => {
    setEpisodeNumber(getEpisodeFromUrl());
    setSeason(getSeasonFromUrl());

    // Reset selected server so the new episode
    // automatically uses its first server.
    setSelectedWatchLinkId(null);
  }, [location, id]);

  /*
   * Convert backend title to the format used by the existing UI.
   */
  const current = remoteDetail
    ? toLegacyTitle(remoteDetail)
    : item;

  /*
   * Find the currently selected season.
   */
  const activeSeason =
    remoteDetail?.seasons?.find(
      (s: any) =>
        Number(s.seasonNumber) === Number(season)
    ) ||
    remoteDetail?.seasons?.[0];

  /*
   * If there is no valid season in the URL,
   * use the actual season that was found.
   */
  useEffect(() => {
    if (
      remoteDetail?.seasons?.length &&
      !remoteDetail.seasons.some(
        (s: any) =>
          Number(s.seasonNumber) === Number(season)
      )
    ) {
      setSeason(
        Number(
          remoteDetail.seasons[0].seasonNumber
        )
      );
    }
  }, [remoteDetail, season]);

  /*
   * Find the exact episode.
   */
  const activeEpisode =
    activeSeason?.episodes?.find(
      (e: any) =>
        Number(e.episodeNumber) ===
        Number(episodeNumber)
    );

  /*
   * Every time the episode changes,
   * remove the previous selected server.
   */
  useEffect(() => {
    setSelectedWatchLinkId(null);
  }, [activeEpisode?.id]);

  /*
   * Go to another episode without opening
   * another page or reloading the website.
   */
  const goToEpisode = (ep: number) => {
    if (!id) return;

    const nextEpisode = Number(ep);

    if (
      !Number.isFinite(nextEpisode) ||
      nextEpisode <= 0
    ) {
      return;
    }

    /*
     * Update React immediately.
     */
    setEpisodeNumber(nextEpisode);

    /*
     * Reset server.
     */
    setSelectedWatchLinkId(null);

    /*
     * Update browser URL through Wouter.
     * No full page reload.
     */
    navigate(
      `/watch/${id}?season=${season}&episode=${nextEpisode}`
    );

    /*
     * Scroll to player.
     */
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * Change season and automatically start
   * episode 1 of that season.
   */
  const goToSeason = (seasonNumber: number) => {
    if (!id) return;

    const nextSeason = Number(seasonNumber);

    if (
      !Number.isFinite(nextSeason) ||
      nextSeason <= 0
    ) {
      return;
    }

    setSeason(nextSeason);
    setEpisodeNumber(1);
    setSelectedWatchLinkId(null);

    navigate(
      `/watch/${id}?season=${nextSeason}&episode=1`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * Loading state.
   */
  if (!current && !watchError) {
    return (
      <Shell>
        <div className="py-20 text-center text-sm text-muted-foreground">
          جارٍ تحميل المشاهدة…
        </div>
      </Shell>
    );
  }

  /*
   * Error state.
   */
  if (!current) {
    return (
      <Shell>
        <EmptyState
          title="Playback unavailable"
          description="This title could not be found."
          href="/"
          label="Return home"
        />
      </Shell>
    );
  }

  const percent = progress[current.id] || 0;

  /*
   * Episodes for the currently selected season.
   */
  const remoteEpisodes =
    activeSeason?.episodes || [];

  const episodes: number[] =
    current.type === "series"
      ? remoteEpisodes
          .map((e: any) =>
            Number(e.episodeNumber)
          )
          .filter((n: number) =>
            Number.isFinite(n)
          )
          .sort(
            (a: number, b: number) =>
              a - b
          )
      : [1];

  /*
   * Previous / next episode.
   */
  const currentIndex =
    episodes.indexOf(episodeNumber);

  const previousEpisode =
    currentIndex > 0
      ? episodes[currentIndex - 1]
      : null;

  const nextEpisode =
    currentIndex >= 0 &&
    currentIndex < episodes.length - 1
      ? episodes[currentIndex + 1]
      : null;

  /*
   * Watch servers belonging ONLY to the
   * currently selected episode.
   */
      const watchLinks =
        current.type === "movie"
          ? remoteDetail?.watchLinks || []
          : activeEpisode?.watchLinks || [];

  /*
   * Selected server.
   * If no server was manually selected,
   * automatically use the first one.
   */
  const selectedWatchLink =
    watchLinks.find(
      (link: any) =>
        link.id === selectedWatchLinkId
    ) || watchLinks[0];

  /*
   * Convert OK.ru / YouTube / Vimeo /
   * direct URLs into playable URLs.
   */
  const embedUrl = selectedWatchLink
    ? getEmbedUrl(selectedWatchLink.url)
    : null;

  /*
   * Detect direct video files.
   */
  const isDirectVideo =
    !!embedUrl &&
    /\.(mp4|webm|ogg)(?:$|[?#])/i.test(
      embedUrl
    );

  /*
   * Save playback progress.
   */
  const update = (amount: number) => {
    if (!Number.isFinite(amount)) {
      return;
    }

    setProgress((prev) => ({
      ...prev,
      [current.id]: Math.min(
        98,
        Math.max(0, amount)
      ),
    }));
  };

  return (
    <Shell>
      <Meta
        title={`Watch ${current.title}`}
        description={`Playback for ${current.title}.`}
      />

      <div className="page-enter">
        <div className="grid gap-7 xl:grid-cols-[1fr_320px]">

          {/* =========================================
              PLAYER
          ========================================= */}
          <div>

            <div className="relative aspect-video overflow-hidden border border-border bg-black">

              {/* Movie trailer */}
              {current.type === "movie" &&
              current.trailer ? (
                <video
                  key={current.trailer}
                  data-testid="video-demo-player"
                  controls
                  playsInline
                  poster={current.backdrop}
                  className="h-full w-full object-contain"
                  onTimeUpdate={(e) => {
                    const video =
                      e.currentTarget;

                    if (
                      video.duration &&
                      Number.isFinite(
                        video.duration
                      )
                    ) {
                      update(
                        (video.currentTime /
                          video.duration) *
                          100
                      );
                    }
                  }}
                >
                  <source
                    src={current.trailer}
                    type="video/mp4"
                  />
                </video>

              ) : selectedWatchLink &&
                embedUrl ? (

                /*
                 * Direct MP4/WebM/OGG
                 */
                isDirectVideo ? (
                  <video
                    key={`${activeEpisode?.id}-${embedUrl}`}
                    data-testid="video-watch-player"
                    controls
                    autoPlay
                    playsInline
                    poster={current.backdrop}
                    className="h-full w-full object-contain"
                    onTimeUpdate={(e) => {
                      const video =
                        e.currentTarget;

                      if (
                        video.duration &&
                        Number.isFinite(
                          video.duration
                        )
                      ) {
                        update(
                          (video.currentTime /
                            video.duration) *
                            100
                        );
                      }
                    }}
                  >
                    <source
                      src={embedUrl}
                    />
                  </video>

                ) : (

                  /*
                   * OK.ru / YouTube / Vimeo / other iframe
                   */
                  <iframe
                    key={`${activeEpisode?.id}-${selectedWatchLink.id}-${embedUrl}`}
                    data-testid="iframe-watch-player"
                    src={embedUrl}
                    title={`${current.title} - Episode ${episodeNumber}`}
                    className="h-full w-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )

              ) : (

                /*
                 * No playable server
                 */
                <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
                  {selectedWatchLink
                    ? "رابط خادم المشاهدة غير صالح."
                    : "اختر خادم مشاهدة من القائمة أدناه لتشغيل الحلقة داخل ASIAN SCREEN."}
                </div>
              )}

            </div>


            {/* =========================================
                WATCH SERVERS
            ========================================= */}
            {watchLinks.length > 0 && (
              <div className="mt-4">

                <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  خوادم المشاهدة
                </p>

                <div className="flex flex-wrap gap-2">

                  {watchLinks.map(
                    (link: any) => {
                      const isSelected =
                        selectedWatchLink?.id ===
                        link.id;

                      return (
                        <button
                          key={link.id}
                          type="button"
                          data-testid={`button-watch-server-${link.id}`}
                          onClick={() => {
                            setSelectedWatchLinkId(
                              link.id
                            );
                          }}
                          className={`border px-4 py-2 text-xs transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                          }`}
                        >
                          {link.name}
                        </button>
                      );
                    }
                  )}

                </div>
              </div>
            )}


            {/* No servers */}
            {current.type === "series" &&
              watchLinks.length === 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  لا توجد روابط مشاهدة لهذه الحلقة بعد.
                </p>
              )}


            {/* Invalid URL */}
            {current.type === "series" &&
              selectedWatchLink &&
              !embedUrl && (
                <p className="mt-3 text-xs text-muted-foreground">
                  تعذر تحويل رابط هذا الخادم إلى مشغل مضمّن.
                </p>
              )}


            {/* =========================================
                TITLE / INFO
            ========================================= */}
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">

              <div>

                <p className="font-mono-ui text-[10px] tracking-[.25em] text-primary">
                  يُعرض الآن
                </p>

                <h1
                  data-testid="text-watch-title"
                  className="mt-2 font-display text-4xl italic"
                >
                  {current.title}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">

                  {current.type === "series"
                    ? `الموسم ${season} · الحلقة ${episodeNumber}`
                    : "فيلم"}

                  {" · "}

                  {countryLabels[current.country] || current.country}

                </p>

              </div>


              {/* Watchlist */}
              <Button
                onClick={() =>
                  toggleWatchlist(current.id)
                }
                variant="outline"
                testId="button-watch-player-list"
              >
                {watchlist.includes(
                  current.id
                ) ? (
                  <Check size={15} />
                ) : (
                  <Bookmark size={15} />
                )}

                {watchlist.includes(
                  current.id
                )
                  ? "في قائمتي"
                  : "أضف إلى قائمتي"}
              </Button>

            </div>


            {/* =========================================
                PROGRESS
            ========================================= */}
            <div className="mt-5 h-1 bg-secondary">

              <div
                className="h-full bg-primary transition-[width]"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, percent)
                  )}%`,
                }}
              />

            </div>


            {/* =========================================
                PREVIOUS / NEXT
            ========================================= */}
            {current.type === "series" &&
              episodes.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

                  <button
                    type="button"
                    disabled={
                      previousEpisode === null
                    }
                    onClick={() => {
                      if (
                        previousEpisode !==
                        null
                      ) {
                        goToEpisode(
                          previousEpisode
                        );
                      }
                    }}
                    className={`border px-4 py-3 text-xs transition ${
                      previousEpisode ===
                      null
                        ? "cursor-not-allowed opacity-30"
                        : "border-border bg-secondary/40 hover:border-primary/60"
                    }`}
                  >
                    ← الحلقة السابقة
                  </button>


                  <button
                    type="button"
                    disabled={
                      nextEpisode === null
                    }
                    onClick={() => {
                      if (
                        nextEpisode !== null
                      ) {
                        goToEpisode(
                          nextEpisode
                        );
                      }
                    }}
                    className={`border px-4 py-3 text-xs transition ${
                      nextEpisode === null
                        ? "cursor-not-allowed opacity-30"
                        : "border-border bg-secondary/40 hover:border-primary/60"
                    }`}
                  >
                    الحلقة التالية →
                  </button>

                </div>
              )}

          </div>


          {/* =========================================
              EPISODE SIDEBAR
          ========================================= */}
          <aside className="border border-border bg-card p-5">

            <div className="flex items-center justify-between">

              <h2 className="font-display text-xl italic">
                الحلقات
              </h2>

              <span className="text-xs text-muted-foreground">
                {episodes.length} حلقة
              </span>

            </div>


            {/* =========================================
                SEASONS
            ========================================= */}
            {remoteDetail?.seasons &&
              remoteDetail.seasons.length > 1 && (
                <div className="mt-5 flex flex-wrap gap-2">

                  {remoteDetail.seasons.map(
                    (s: any) => {

                      const seasonNumber =
                        Number(
                          s.seasonNumber
                        );

                      const isActive =
                        seasonNumber ===
                        Number(season);

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            goToSeason(
                              seasonNumber
                            )
                          }
                          className={`border px-3 py-2 text-xs transition ${
                            isActive
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/60"
                          }`}
                        >
                          {s.title ||
                            `الموسم ${seasonNumber}`}
                        </button>
                      );
                    }
                  )}

                </div>
              )}


            {/* =========================================
                EPISODES
            ========================================= */}
            <div className="mt-5 max-h-[650px] space-y-2 overflow-y-auto pr-1">

              {episodes.length > 0 ? (
                episodes.map((ep) => {

                  const isActive =
                    Number(ep) ===
                    Number(
                      episodeNumber
                    );

                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() =>
                        goToEpisode(ep)
                      }
                      data-testid={`link-watch-episode-${ep}`}
                      className={`flex w-full items-center gap-3 border px-3 py-3 text-right text-sm transition ${
                        isActive
                          ? "border-primary/60 bg-primary/10"
                          : "border-border hover:bg-secondary"
                      }`}
                    >

                      <span className="font-mono-ui text-xs text-primary">
                        {String(ep).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span>
                        {current.type ===
                        "series"
                          ? `الحلقة ${ep}`
                          : "تشغيل الفيلم"}
                      </span>

                      {isActive && (
                        <span className="mr-auto text-[10px] text-primary">
                          تشاهد الآن
                        </span>
                      )}

                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  لا توجد حلقات متاحة لهذا الموسم.
                </div>
              )}

            </div>

          </aside>

        </div>


        {/* =========================================
            CONTINUE WATCHING / SIMILAR
        ========================================= */}
        {allRemote?.items && (
          <Row
            title="قد يعجبك أيضًا"
            items={allRemote.items
              .map(toLegacyTitle)
              .filter(
                (t) =>
                  t.id !== current.id &&
                  t.genres.some((g) =>
                    current.genres.includes(g)
                  )
              )
              .slice(0, 6)}
            onToast={() => undefined}
          />
        )}

      </div>
    </Shell>
  );
}
function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get('q') || '');
  const [toast, setToast] = useState('');
  const remote = usePublicTitles({ q: query, page: 1, pageSize: 100 });
  const found = remote.items.map(toLegacyTitle).sort((a,b)=>b.popularity-a.popularity);
  return <Shell><Meta title="البحث" description="ابحث عن العناوين والممثلين والمخرجين في Asian Screen." /><div className="page-enter"><p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">فهرس الشاشة</p><h1 className="mt-3 font-display text-4xl md:text-6xl">اعثر على قصتك القادمة.</h1><div className="relative mt-8 max-w-2xl"><Search size={20} className="pointer-events-none absolute right-4 top-4 text-muted-foreground" /><input autoFocus data-testid="input-search-page" value={query} onChange={e=>setQuery(e.target.value)} placeholder="عنوان، ممثل، مخرج أو بلد..." className="h-14 w-full border border-border bg-secondary/70 pl-4 pr-12 text-base outline-none focus:border-primary" /></div><div className="mt-10 flex items-center justify-between border-b border-border pb-4 text-xs text-muted-foreground"><span data-testid="text-search-count">{query ? `${found.length} نتيجة للبحث «${query}»` : 'ابدأ بعنوان أو وجه أو إحساس.'}</span></div>{query && (remote.loading ? <div className="py-10 text-center text-sm text-muted-foreground">جارٍ البحث…</div> : found.length ? <div className="stagger mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{found.map(item=><PosterCard key={item.id} item={item} onToast={setToast} />)}</div> : <EmptyState title="لا نتيجة في الأرشيف" description="جرّب تهجئة مختلفة أو ابحث باسم المخرج أو البلد أو أحد الممثلين." href="/genres" label="تصفح التصنيفات" />)}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function GenresPage() {
  const remote = usePublicTitles({ page: 1, pageSize: 100 });
  const all = remote.items.map(toLegacyTitle);
  const genreList = Array.from(new Set(remote.items.flatMap(item => item.genres))).sort();
  if (remote.loading) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل التصنيفات…</div></Shell>;
  if (remote.error) return <Shell><EmptyState title="تعذر تحميل التصنيفات" description="حاول مرة أخرى بعد قليل." href="/genres" label="إعادة المحاولة" /></Shell>;
  return <Shell><Meta title="التصنيفات" description="اكتشف الأفلام والدراما الآسيوية حسب التصنيف." /><div className="page-enter"><p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">دليل المزاج</p><h1 className="mt-3 max-w-3xl font-display text-4xl md:text-6xl">بماذا ترغب أن تشعر الليلة؟</h1><div className="mt-12 grid border-r border-t border-border sm:grid-cols-2 lg:grid-cols-3">{genreList.map((genre,i)=><Link key={genre} href={`/genre/${genre.toLowerCase()}`} data-testid={`link-genre-${genre.toLowerCase()}`} className="group relative min-h-[170px] border-b border-l border-border p-6 transition hover:bg-secondary/70"><span className="font-mono-ui text-[10px] text-primary">{String(i+1).padStart(2,'0')}</span><h2 className="mt-12 font-display text-3xl group-hover:text-accent">{genreLabels[genre] || genre}</h2><p className="mt-2 text-xs text-muted-foreground">{all.filter(t=>t.genres.includes(genre)).length} قصة في الأرشيف</p><ChevronRight size={16} className="absolute bottom-6 left-6 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-accent" /></Link>)}</div></div></Shell>;
}

function GenrePage() {
  const { genre } = useParams<{genre:string}>();
  const remote = usePublicTitles({ genre, page: 1, pageSize: 100 });
  const selectedKey = genre ? genre.charAt(0).toUpperCase() + genre.slice(1) : 'Drama';
  const selected = genreLabels[selectedKey] || genre || 'Drama';
  const [toast, setToast] = useState('');
  const items = remote.items.map(toLegacyTitle);
  if (remote.loading) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل التصنيف…</div></Shell>;
  if (remote.error) return <Shell><EmptyState title="تعذر تحميل التصنيف" description="حاول مرة أخرى بعد قليل." href="/genres" label="كل التصنيفات" /></Shell>;
  return <Shell><Meta title={`${selected} / التصنيف`} description={`أفلام ومسلسلات آسيوية مختارة ضمن تصنيف ${selected}`} /><div className="page-enter"><Link href="/genres" data-testid="link-back-genres" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/> كل التصنيفات</Link><h1 className="mt-6 font-display text-6xl italic md:text-8xl">{selected}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">قصص مختارة تحمل الأجواء نفسها في تفاصيلها</p><div className="stagger mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{items.map(item=><PosterCard key={item.id} item={item} onToast={setToast}/>)}</div></div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function Watchlist() {
  const [toast, setToast] = useState('');
  const [ids, toggle] = useIds('asian-watchlist');
  const remote = usePublicTitles({ page: 1, pageSize: 100 });
  const items = remote.items.map(toLegacyTitle).filter(item => ids.includes(item.id));
  if (remote.loading) return <Shell><div className="py-20 text-center text-sm text-muted-foreground">جارٍ تحميل قائمتك…</div></Shell>;
  if (remote.error) return <Shell><EmptyState title="تعذر تحميل قائمتك" description="حاول مرة أخرى بعد قليل." href="/watchlist" label="إعادة المحاولة" /></Shell>;
  return <Shell><Meta title="قائمتي" description="أعمالك المحفوظة في Asian Screen." /><div className="page-enter"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">قائمتك الخاصة</p><h1 className="mt-3 font-display text-6xl italic md:text-8xl">قائمتي<span className="text-primary">.</span></h1><p className="mt-3 text-sm text-muted-foreground">{items.length} {items.length === 1 ? 'عمل' : 'أعمال'} بانتظارك.</p>{items.length ? <div className="stagger mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{items.map(item=><div key={item.id} className="relative"><PosterCard item={item} onToast={setToast}/><button onClick={()=>{toggle(item.id);setToast('تمت إزالة العمل من قائمتك');}} data-testid={`button-remove-watchlist-${item.id}`} className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary"><X size={12}/> إزالة</button></div>)}</div> : <EmptyState title="قائمتك فارغة" description="احفظ الأفلام والمسلسلات أثناء التصفح وستجدها هنا عندما يحين وقت مشاهدتها." href="/movies" label="استكشف الأفلام" />}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function Profile() {
  const [profile, setProfile] = useStored<{name:string;email:string}>('asian-profile',{name:'',email:''});
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [form, setForm] = useState(profile);
  const [toast, setToast] = useState('');
  const [watchIds] = useIds('asian-watchlist');
  const [favoriteDramas] = useIds('asian-favorite-dramas');
  const [favoriteMovies] = useIds('asian-favorite-movies');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if(mode==='forgot'){setToast('سيتم إرسال رابط إعادة التعيين في النسخة الكاملة');return;} if(!form.email){setToast('أدخل بريدك الإلكتروني للمتابعة');return;} setProfile({...form,name:form.name || form.email.split('@')[0]}); setToast(mode==='register'?'قائمتك جاهزة':'مرحبًا بعودتك'); };
  const logged = Boolean(profile.email);
  return <Shell><Meta title="ملفي الشخصي" description="إدارة ملفك الشخصي وقوائمك في Asian Screen." /><div className="page-enter"><div className="border-b border-border pb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">أرشيفك الشخصي</p><h1 className="mt-3 font-display text-6xl italic md:text-8xl">{logged ? `مرحبًا، ${profile.name}.` : 'ملفك الشخصي'}</h1><p className="mt-3 text-sm text-muted-foreground">{logged ? 'احتفظ بقصصك المفضلة في مكان واحد' : 'سجّل الدخول واحفظ قائمتك ومفضلاتك في مكان واحد'}</p></div>{!logged ? <div className="mt-10 max-w-md border border-border bg-card p-6"><div className="mb-6 flex gap-4 border-b border-border text-xs uppercase tracking-widest">{(['login','register','forgot'] as const).map(item=><button key={item} onClick={()=>setMode(item)} data-testid={`button-profile-${item}`} className={`pb-3 ${mode===item?'border-b-2 border-primary text-foreground':'text-muted-foreground'}`}>{item === 'login' ? 'تسجيل الدخول' : item === 'register' ? 'إنشاء حساب' : 'نسيت كلمة المرور'}</button>)}</div><form onSubmit={submit} className="space-y-4">{mode==='register'&&<input data-testid="input-profile-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="اسمك" className="h-11 w-full border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" />}<input data-testid="input-profile-email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="البريد الإلكتروني" className="h-11 w-full border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" />{mode!=='forgot'&&<input data-testid="input-profile-password" type="password" placeholder="كلمة المرور" className="h-11 w-full border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" />}<Button type="submit" testId="button-profile-submit" className="w-full">{mode==='forgot'?'إرسال رابط إعادة التعيين':mode==='register'?'إنشاء حساب':'تسجيل الدخول'}</Button></form></div> : <div className="mt-10 grid gap-4 sm:grid-cols-3"><Stat label="في قائمتك" value={watchIds.length} href="/watchlist" /><Stat label="المسلسلات المفضلة" value={favoriteDramas.length} href="/series" /><Stat label="الأفلام المفضلة" value={favoriteMovies.length} href="/movies" /><button onClick={()=>{setProfile({name:'',email:''});setToast('تم تسجيل الخروج');}} data-testid="button-signout" className="border border-border p-5 text-left text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary"><Settings size={18} className="mb-4" /> تسجيل الخروج</button></div>}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function Stat({label,value,href}:{label:string;value:number;href:string}) { return <Link href={href} data-testid={`link-stat-${label.toLowerCase().replaceAll(' ','-')}`} className="border border-border bg-card p-5 transition hover:border-primary"><p className="font-mono-ui text-3xl text-accent">{value}</p><p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">{label}</p></Link>; }

function Admin() {
  return <Shell><Meta title="إدارة المحتوى" description="إدارة قاعدة بيانات Asian Screen." /><AdminConsole /></Shell>;
}

function AdminStat({label,value}:{label:string;value:number}) { return <div className="border border-border bg-card p-4"><p className="font-mono-ui text-2xl text-accent">{value}</p><p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p></div>; }

function NotFound() { return <Shell><div className="grid min-h-[60vh] place-items-center text-center"><div><p className="font-mono-ui text-xs uppercase tracking-[.3em] text-primary">404 / Lost reel</p><h1 className="mt-5 font-display text-6xl italic">Nothing playing here.</h1><Link href="/" data-testid="link-not-found-home" className="mt-8 inline-flex items-center gap-2 border border-border px-4 py-3 text-xs uppercase tracking-widest hover:border-primary"><ArrowLeft size={14}/> Back to home</Link></div></div></Shell>; }

function Router() {
  return <Switch><Route path="/" component={Home}/><Route path="/movies"><Catalog type="movie"/></Route><Route path="/series/upcoming"><Shell><Meta title="الدراما القادمة" description="اكتشف الدراما الآسيوية القادمة على Asian Screen." /><DramaListingPage status="Upcoming" title="الدراما القادمة" description="قصص آسيوية جديدة تستعد للوصول إلى رف Asian Screen." /></Shell></Route><Route path="/series/airing"><Shell><Meta title="الدراما التي تبث حالياً" description="تابع الدراما الآسيوية التي تبث حالياً على Asian Screen." /><DramaListingPage status="Ongoing" title="الدراما التي تبث حالياً" description="تابع القصص التي ما زالت تنبض بحلقات جديدة الآن." /></Shell></Route><Route path="/series/completed"><Shell><Meta title="الدراما المنتهية مؤخراً" description="اكتشف الدراما الآسيوية المكتملة مؤخراً على Asian Screen." /><DramaListingPage status="Completed" title="الدراما المنتهية مؤخراً" description="أعمال مكتملة تستحق جلسة مشاهدة هادئة من البداية إلى النهاية." /></Shell></Route><Route path="/series"><Catalog type="series"/></Route><Route path="/episodes" component={NewEpisodesPage}/>
    <Route path="/country/china-taiwan">
      <CountryPage country="ChinaTaiwan" />
    </Route>
    {COUNTRIES.map(c=><Route key={c} path={`/country/${c.toLowerCase()}`}><CountryPage country={c}/></Route>)}
    <Route path="/genres" component={GenresPage}/><Route path="/genre/:genre" component={GenrePage}/><Route path="/search" component={SearchPage}/><Route path="/movie/:id"><Detail type="movie"/></Route><Route path="/series/:id"><Detail type="series"/></Route><Route path="/watch/:id"><Watch item={undefined}/></Route><Route path="/watchlist" component={Watchlist}/><Route path="/profile" component={Profile}/><Route path="/admin" component={Admin}/><Route component={NotFound}/></Switch>;
}

function App() {
  return <ErrorBoundary><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></ErrorBoundary>;
}

export default App;