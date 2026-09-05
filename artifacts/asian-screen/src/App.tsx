import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowUp, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Film, Heart, Pencil, Play, Plus, Search, Settings, SlidersHorizontal, Sparkles, Trash2, UserRound, X } from 'lucide-react';
import { countries, genres, getTitle, titles, type Country, type Title, type TitleType } from '@/lib/data';
import { readStored, toggleStored, useStored } from '@/lib/store';
import SiteHeader from '@/components/site-header';
import { EpisodePanels, FeaturedCarousel, MediaRow, PosterCard, statusLabel, supportedSeries } from '@/components/media-components';
import { DramaListingPage } from '@/components/drama-listing';

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
  const korean = supportedSeries.filter(item => item.country === 'Korea').sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  const asian = [...supportedSeries].sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  const series = (country: Title['country']) => titles.filter(item => item.country === country && item.type === 'series').sort((a, b) => b.popularity - a.popularity);
  return <Shell><Meta title="اكتشف قصتك القادمة" description="Asian Screen منصة اكتشاف للدراما الحية والأفلام الآسيوية من كوريا والصين واليابان وتايلاند وتايوان." /><div className="page-enter">
    <FeaturedCarousel items={[...titles].sort((a, b) => b.popularity - a.popularity)} />
    <div className="mx-auto max-w-[1160px]">
      <div className="mt-12 grid gap-5 border-y border-border py-8 md:grid-cols-[1.15fr_1fr] md:items-end"><div><p className="font-mono-ui text-[10px] tracking-[.18em] text-accent">ASIAN SCREEN / اختيارات محررة</p><p className="mt-3 max-w-2xl font-display text-2xl leading-relaxed text-foreground md:text-3xl">حكايات لها نبض، وأداء يبقى معك بعد انتهاء التتر.</p></div><p className="text-sm leading-7 text-muted-foreground">رفّ حيّ للسينما الآسيوية والدراما الحية، نختارها للأجواء والشخصيات لا للخوارزميات.</p></div>
      <EpisodePanels korean={korean} asian={asian} />
      <MediaRow title="أضيفت مؤخراً" items={[...titles].sort((a, b) => b.year - a.year)} eyebrow="على الرف الآن" onToast={setToast} />
      <MediaRow title="الأفلام الآسيوية" items={titles.filter(item => item.type === 'movie')} onToast={setToast} href="/movies" />
      <MediaRow title="الدراما الكورية" items={series('Korea')} onToast={setToast} href="/country/korea" />
      <MediaRow title="الدراما الصينية والتايوانية" items={titles.filter(item => item.type === 'series' && (item.country === 'China' || item.country === 'Taiwan')).sort((a, b) => b.popularity - a.popularity)} onToast={setToast} href="/country/china" />
      <MediaRow title="الدراما اليابانية" items={series('Japan')} onToast={setToast} href="/country/japan" />
      <MediaRow title="الدراما التايلاندية" items={series('Thailand')} onToast={setToast} href="/country/thailand" />
      {titles.some(item => item.status === 'Ongoing') && <MediaRow title="يعرض حالياً" items={titles.filter(item => item.status === 'Ongoing')} onToast={setToast} />}
    </div>
  </div>{toast && <Toast message={toast} onClose={() => setToast('')} />}</Shell>;
}

function NewEpisodesPage() {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const sorted = [...supportedSeries].sort((a, b) => b.year - a.year || b.popularity - a.popularity);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const items = sorted.slice((page - 1) * pageSize, page * pageSize);
  return <Shell><Meta title="الحلقات الجديدة" description="تابع أحدث حلقات الدراما الآسيوية الحية على Asian Screen." /><div className="page-enter">
    <div className="border-b border-border pb-8"><p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">ASIAN SCREEN / تحديثات اليوم</p><h1 className="mt-3 font-display text-4xl md:text-6xl">الحلقات الجديدة</h1><p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">آخر الإضافات من الدراما الكورية والصينية واليابانية والتايلاندية والتايوانية، في مكان واحد.</p></div>
    <div data-testid="grid-new-episodes" className="stagger mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{items.map(item => <div key={item.id} className="min-w-0"><PosterCard item={item} onToast={() => undefined} /><Link href={`/watch/${item.id}?episode=1`} data-testid={`link-new-episode-watch-${item.id}`} className="mt-3 flex items-center justify-between border border-border px-3 py-2 text-[10px] font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"><span>الحلقة 01 · {statusLabel(item.status)}</span><Play size={12} /></Link></div>)}</div>
    <div className="mt-10 flex items-center justify-center gap-2" dir="rtl" aria-label="صفحات الحلقات"><button type="button" disabled={page === 1} onClick={() => setPage(value => Math.max(1, value - 1))} data-testid="button-episodes-previous" aria-label="الصفحة السابقة" className="grid h-9 w-9 place-items-center border border-border text-muted-foreground hover:border-primary disabled:opacity-30"><ChevronRight size={15} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map(value => <button type="button" key={value} onClick={() => setPage(value)} data-testid={`button-episodes-page-${value}`} aria-label={`الصفحة ${value}`} className={`grid h-9 w-9 place-items-center border text-xs ${page === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary'}`}>{value}</button>)}<button type="button" disabled={page === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))} data-testid="button-episodes-next" aria-label="الصفحة التالية" className="grid h-9 w-9 place-items-center border border-border text-muted-foreground hover:border-primary disabled:opacity-30"><ChevronLeft size={15} /></button></div>
  </div></Shell>;
}

function FilterBar({ type, country, genre, year, rating, sort, onChange }: { type: TitleType|'all'; country: string; genre: string; year: string; rating: string; sort: Sort; onChange: (key: string, value: string) => void }) {
  return <div className="grid gap-2 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-6"><div className="relative sm:col-span-2 lg:col-span-2"><SlidersHorizontal size={15} className="pointer-events-none absolute right-3 top-3 text-muted-foreground" /><select data-testid="select-country-filter" value={country} onChange={e=>onChange('country',e.target.value)} className="h-10 w-full appearance-none rounded-sm border border-border bg-secondary pl-3 pr-9 text-xs outline-none"><option value="">كل البلدان</option>{countries.map(c=><option key={c} value={c}>{c}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /></div><select data-testid="select-genre-filter" value={genre} onChange={e=>onChange('genre',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="">كل التصنيفات</option>{genres.map(g=><option key={g} value={g}>{g}</option>)}</select><select data-testid="select-year-filter" value={year} onChange={e=>onChange('year',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="">كل السنوات</option>{[2024,2023,2022,2021,2020,2019,2018,2017,2016].map(y=><option key={y} value={y}>{y}</option>)}</select><select data-testid="select-rating-filter" value={rating} onChange={e=>onChange('rating',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="">كل التقييمات</option><option value="8.5">8.5+</option><option value="8">8.0+</option><option value="7.5">7.5+</option></select><select data-testid="select-sort" value={sort} onChange={e=>onChange('sort',e.target.value)} className="h-10 rounded-sm border border-border bg-secondary px-3 text-xs outline-none"><option value="popularity">الأكثر شعبية</option><option value="rating">الأعلى تقييماً</option><option value="newest">الأحدث</option><option value="alpha">أبجدياً</option></select></div>;
}

function Catalog({ type }: { type: TitleType }) {
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({country:'',genre:'',year:'',rating:'',sort:'popularity' as Sort});
  const filtered = useMemo(() => {
    const result = titles.filter(t => t.type === type && (!query || `${t.title} ${t.originalTitle} ${t.cast.join(' ')} ${t.director}`.toLowerCase().includes(query.toLowerCase())) && (!filters.country || t.country === filters.country) && (!filters.genre || t.genres.includes(filters.genre)) && (!filters.year || String(t.year) === filters.year) && (!filters.rating || t.rating >= Number(filters.rating)));
    return result.sort((a,b) => filters.sort === 'rating' ? b.rating-a.rating : filters.sort === 'newest' ? b.year-a.year : filters.sort === 'alpha' ? a.title.localeCompare(b.title) : b.popularity-a.popularity);
  }, [type, query, filters]);
  const change = (key: string, value: string) => setFilters(prev => ({...prev, [key]: value}));
  return <Shell><Meta title={`${type === 'movie' ? 'Movies' : 'Dramas'} / Explore`} description={`Explore curated Asian ${type === 'movie' ? 'movies' : 'live-action dramas'} by country, genre and year.`} /><div className="page-enter"><div className="flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">The catalogue / {type === 'movie' ? '01' : '02'}</p><h1 className="mt-3 font-display text-5xl italic md:text-7xl">{type === 'movie' ? 'Asian movies' : 'Dramas worth staying up for'}</h1></div><div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={16} /><input data-testid={`input-${type}-catalog-search`} value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${type === 'movie' ? 'movies' : 'dramas'}...`} className="h-10 w-full rounded-sm border border-border bg-secondary pl-9 pr-3 text-sm outline-none focus:border-primary" /></div></div><div className="mt-7"><FilterBar type={type} country={filters.country} genre={filters.genre} year={filters.year} rating={filters.rating} sort={filters.sort} onChange={change} /></div><div className="mt-8 flex items-center justify-between text-xs text-muted-foreground"><span data-testid="text-results-count">{filtered.length} titles</span>{filtered.length === 0 && <span>Try loosening your filters.</span>}</div>{filtered.length ? <div className="stagger mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">{filtered.map(item=><PosterCard key={item.id} item={item} onToast={setToast} />)}</div> : <EmptyState title="No titles in this cut" description="The shelf is quiet here. Try another country, genre or year." href={type === 'movie' ? '/series' : '/movies'} label={type === 'movie' ? 'Browse dramas' : 'Browse movies'} />}</div>{toast && <Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function CountryPage({ country }: { country: Country }) {
  const [toast, setToast] = useState('');
  const [genre, setGenre] = useState('');
  const list = titles.filter(t=>t.country===country && (!genre || t.genres.includes(genre)));
  const featured = list[0] || titles[0];
  return <Shell><Meta title={`${country} / Discovery`} description={`Discover the most atmospheric ${country} movies and live-action dramas on Asian Screen.`} /><div className="page-enter"><section className="relative -mx-5 min-h-[430px] overflow-hidden border-b border-border lg:-mx-10"><img src={featured.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" /><div className="relative flex min-h-[430px] max-w-xl flex-col justify-end px-6 pb-12 lg:px-16"><p className="font-mono-ui text-[10px] uppercase tracking-[.3em] text-primary">Country notes / {country}</p><h1 className="mt-3 font-display text-6xl italic">{country}<br /><span className="text-accent">after dark.</span></h1><p className="mt-4 text-sm leading-6 text-muted-foreground">The voices, faces and places shaping {country} on screen right now.</p></div></section><div className="mt-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">{['All',...genres].map(g=><button key={g} onClick={()=>setGenre(g==='All'?'':g)} data-testid={`button-country-genre-${g.toLowerCase()}`} className={`whitespace-nowrap border px-3 py-2 text-[10px] uppercase tracking-widest transition ${genre===(g==='All'?'':g) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/60'}`}>{g}</button>)}</div><Row title="Latest arrivals" eyebrow="New on the shelf" items={list.sort((a,b)=>b.year-a.year)} onToast={setToast} /><Row title="Popular right now" items={list.sort((a,b)=>b.popularity-a.popularity)} onToast={setToast} /><Row title="Top rated" items={list.sort((a,b)=>b.rating-a.rating)} onToast={setToast} /><Row title={`${country} movies`} items={list.filter(t=>t.type==='movie')} onToast={setToast} href="/movies" /></div>{toast && <Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function EmptyState({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return <div data-testid="empty-state" className="mx-auto mt-12 max-w-lg border border-dashed border-border px-6 py-14 text-center"><Clock3 className="mx-auto text-accent" size={24} /><h2 className="mt-5 font-display text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><Link href={href} data-testid="link-empty-explore" className="mt-6 inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-semibold hover:border-primary"><ArrowLeft size={14} /> {label}</Link></div>;
}

function Detail({ type }: { type: TitleType }) {
  const { id } = useParams<{ id: string }>();
  const item = getTitle(id);
  const [toast, setToast] = useState('');
  const [watchlist, toggleWatchlist] = useIds('asian-watchlist');
  const [favorites, toggleFavorite] = useIds(type === 'movie' ? 'asian-favorite-movies' : 'asian-favorite-dramas');
  if (!item) return <Shell><EmptyState title="A missing reel" description="That title has left the catalogue." href="/" label="Return home" /></Shell>;
  const saved = watchlist.includes(item.id);
  const favorite = favorites.includes(item.id);
  const similar = titles.filter(t=>t.id!==item.id && (t.country===item.country || t.genres.some(g=>item.genres.includes(g)))).slice(0,6);
  const toggle = () => { toggleWatchlist(item.id); setToast(saved ? 'Removed from your shelf' : 'Added to your shelf'); };
  return <Shell><Meta title={item.title} description={item.description} /><div className="page-enter"><section className="relative -mx-5 min-h-[510px] overflow-hidden border-b border-border lg:-mx-10"><img src={item.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/25" /><div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" /><div className="relative flex min-h-[510px] max-w-2xl flex-col justify-end px-6 pb-12 lg:px-16"><Link href={type==='movie'?'/movies':'/series'} data-testid="link-back-catalog" className="mb-auto mt-4 flex items-center gap-2 self-start text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Back to catalogue</Link><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">{item.country} / {item.type} / {item.year}</p><h1 data-testid="text-detail-title" className="mt-3 font-display text-5xl leading-none italic md:text-7xl">{item.title}</h1><p className="mt-2 text-sm italic text-muted-foreground">{item.originalTitle}</p><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{item.description}</p><div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"><span className="text-accent">★ {item.rating}</span><span>{item.year}</span><span>{item.language}</span><span>{item.genres.join(' · ')}</span><span className="border border-border px-2 py-1">{item.hd}</span></div><div className="mt-7 flex flex-wrap gap-3"><Link href={`/watch/${item.id}`} data-testid="link-detail-watch" className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground"><Play size={15} fill="currentColor" /> Watch now</Link><Button onClick={toggle} variant="outline" testId="button-detail-watchlist">{saved ? <Check size={15} /> : <Plus size={15} />}{saved ? 'On shelf' : 'Add to shelf'}</Button><Button onClick={()=>{toggleFavorite(item.id); setToast(favorite ? 'Removed from favorites' : 'Saved as a favorite');}} variant="ghost" testId="button-detail-favorite"><Heart size={16} fill={favorite?'currentColor':'none'} /> Favorite</Button></div></div></section><div className="grid gap-10 py-10 md:grid-cols-[1fr_280px]"><div><div className="border-b border-border pb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">A closer look</p><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{item.description} Every frame is a small act of attention, and every performance leaves a different trace after midnight.</p></div>{type==='series' && <div className="mt-8 border-b border-border pb-8"><div className="flex items-center justify-between"><h2 className="font-display text-2xl italic">Episodes</h2><span className="text-xs text-muted-foreground">{item.seasons} seasons · {item.episodes} episodes</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{Array.from({length: Math.min(item.episodes, 8)},(_,i)=><Link key={i} href={`/watch/${item.id}?episode=${i+1}`} data-testid={`link-episode-${item.id}-${i+1}`} className="flex items-center gap-3 border border-border bg-secondary/40 px-3 py-3 text-sm transition hover:border-primary/60"><span className="font-mono-ui text-xs text-primary">{String(i+1).padStart(2,'0')}</span><span>Episode {i+1}</span><Play size={13} className="ml-auto text-muted-foreground" /></Link>)}</div></div>}</div><aside className="space-y-7"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">Details</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Director</dt><dd className="text-right">{item.director}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Cast</dt><dd className="max-w-[160px] text-right">{item.cast.join(', ')}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd className="text-accent">{statusLabel(item.status)}</dd></div></dl></div></aside></div><Row title="You might also like" items={similar} onToast={setToast} /></div>{toast && <Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function Watch({ item }: { item: Title | undefined }) {
  const { id } = useParams<{ id: string }>();
  const [progress, setProgress] = useStored<Record<string,number>>('asian-progress', {});
  const [watchlist, toggleWatchlist] = useIds('asian-watchlist');
  const [season, setSeason] = useState(1);
  const current = item || getTitle(id);
  if (!current) return <Shell><EmptyState title="Playback unavailable" description="This demo reel could not be found." href="/" label="Return home" /></Shell>;
  const percent = progress[current.id] || 0;
  const episodes = current.type === 'series' ? Array.from({length: Math.min(current.episodes, 8)}, (_,i)=>i+1) : [1];
  const update = (amount: number) => setProgress(prev=>({...prev,[current.id]: Math.min(98, amount)}));
  return <Shell><Meta title={`Watch ${current.title}`} description={`Demo playback for ${current.title}.`} /><div className="page-enter"><div className="grid gap-7 xl:grid-cols-[1fr_320px]"><div><div className="relative aspect-video overflow-hidden border border-border bg-black"><video data-testid="video-demo-player" controls poster={current.backdrop} className="h-full w-full" onTimeUpdate={e=>update(Math.round((e.currentTarget.currentTime/e.currentTarget.duration)*100)||percent)}><source src={current.trailer} type="video/mp4" /></video><div className="pointer-events-none absolute left-4 top-4 border border-white/20 bg-black/50 px-2 py-1 font-mono-ui text-[9px] uppercase tracking-widest text-white">Demo stream · {current.hd}</div></div><div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">Now playing</p><h1 data-testid="text-watch-title" className="mt-2 font-display text-4xl italic">{current.title}</h1><p className="mt-2 text-sm text-muted-foreground">{current.type==='series'?`Season ${season} · Episode 1`:'Feature film'} · {current.country}</p></div><Button onClick={()=>toggleWatchlist(current.id)} variant="outline" testId="button-watch-player-list">{watchlist.includes(current.id)?<Check size={15}/>:<Bookmark size={15}/>} {watchlist.includes(current.id)?'On shelf':'Add to shelf'}</Button></div><div className="mt-5 h-1 bg-secondary"><div className="h-full bg-primary transition-[width]" style={{width:`${percent}%`}} /></div><div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground"><span>{percent}% watched</span><span>Progress saves automatically</span></div></div><aside className="border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl italic">Up next</h2>{current.type==='series' && <select data-testid="select-watch-season" value={season} onChange={e=>setSeason(Number(e.target.value))} className="border border-border bg-secondary px-2 py-1 text-xs">{Array.from({length:current.seasons},(_,i)=><option key={i} value={i+1}>Season {i+1}</option>)}</select>}</div><div className="mt-5 space-y-2">{episodes.map(ep=><Link key={ep} href={`/watch/${current.id}?episode=${ep}`} data-testid={`link-watch-episode-${ep}`} className={`flex items-center gap-3 border px-3 py-3 text-sm transition ${ep===1?'border-primary/60 bg-primary/10':'border-border hover:bg-secondary'}`}><span className="font-mono-ui text-xs text-primary">{String(ep).padStart(2,'0')}</span><span>{current.type==='series'?`Episode ${ep}`:'Play film'}</span>{ep===1&&<span className="ml-auto text-[9px] uppercase tracking-widest text-accent">Current</span>}</Link>)}</div></aside></div><Row title="Continue the mood" items={titles.filter(t=>t.id!==current.id && t.genres.some(g=>current.genres.includes(g))).slice(0,6)} onToast={()=>undefined} /></div></Shell>;
}

function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get('q') || '');
  const [toast, setToast] = useState('');
  const found = titles.filter(t=>`${t.title} ${t.originalTitle} ${t.cast.join(' ')} ${t.director} ${t.country}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.popularity-a.popularity);
  return <Shell><Meta title="البحث" description="ابحث عن العناوين والممثلين والمخرجين في Asian Screen." /><div className="page-enter"><p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">فهرس الشاشة</p><h1 className="mt-3 font-display text-4xl md:text-6xl">اعثر على قصتك القادمة.</h1><div className="relative mt-8 max-w-2xl"><Search size={20} className="pointer-events-none absolute right-4 top-4 text-muted-foreground" /><input autoFocus data-testid="input-search-page" value={query} onChange={e=>setQuery(e.target.value)} placeholder="عنوان، ممثل، مخرج أو بلد..." className="h-14 w-full border border-border bg-secondary/70 pl-4 pr-12 text-base outline-none focus:border-primary" /></div><div className="mt-10 flex items-center justify-between border-b border-border pb-4 text-xs text-muted-foreground"><span data-testid="text-search-count">{query ? `${found.length} نتيجة للبحث «${query}»` : 'ابدأ بعنوان أو وجه أو إحساس.'}</span></div>{query && (found.length ? <div className="stagger mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{found.map(item=><PosterCard key={item.id} item={item} onToast={setToast} />)}</div> : <EmptyState title="لا نتيجة في الأرشيف" description="جرّب تهجئة مختلفة أو ابحث باسم المخرج أو البلد أو أحد الممثلين." href="/genres" label="تصفح التصنيفات" />)}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')} />}</Shell>;
}

function GenresPage() {
  return <Shell><Meta title="التصنيفات" description="اكتشف الأفلام والدراما الآسيوية حسب التصنيف." /><div className="page-enter"><p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">دليل المزاج</p><h1 className="mt-3 max-w-3xl font-display text-4xl md:text-6xl">بماذا ترغب أن تشعر الليلة؟</h1><div className="mt-12 grid border-r border-t border-border sm:grid-cols-2 lg:grid-cols-3">{genres.map((genre,i)=><Link key={genre} href={`/genre/${genre.toLowerCase()}`} data-testid={`link-genre-${genre.toLowerCase()}`} className="group relative min-h-[170px] border-b border-l border-border p-6 transition hover:bg-secondary/70"><span className="font-mono-ui text-[10px] text-primary">{String(i+1).padStart(2,'0')}</span><h2 className="mt-12 font-display text-3xl group-hover:text-accent">{genre}</h2><p className="mt-2 text-xs text-muted-foreground">{titles.filter(t=>t.genres.includes(genre)).length} قصة في الأرشيف</p><ChevronRight size={16} className="absolute bottom-6 left-6 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-accent" /></Link>)}</div></div></Shell>;
}

function GenrePage() {
  const { genre } = useParams<{genre:string}>();
  const selected = genres.find(g=>g.toLowerCase()===genre?.toLowerCase()) || genre || 'Drama';
  const [toast, setToast] = useState('');
  const items = titles.filter(t=>t.genres.some(g=>g.toLowerCase()===selected.toLowerCase()));
  return <Shell><Meta title={`${selected} / Genre`} description={`Curated Asian ${selected.toLowerCase()} movies and dramas.`} /><div className="page-enter"><Link href="/genres" data-testid="link-back-genres" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/> All genres</Link><h1 className="mt-6 font-display text-6xl italic md:text-8xl">{selected}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">A cut of stories with the same weather in their bones.</p><div className="stagger mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{items.map(item=><PosterCard key={item.id} item={item} onToast={setToast}/>)}</div></div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function Watchlist() {
  const [toast, setToast] = useState('');
  const [ids, toggle] = useIds('asian-watchlist');
  const items = ids.map(id=>getTitle(id)).filter((item): item is Title=>Boolean(item));
  return <Shell><Meta title="Your shelf" description="Your saved Asian Screen titles." /><div className="page-enter"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">Your private shelf</p><h1 className="mt-3 font-display text-6xl italic md:text-8xl">Watchlist<span className="text-primary">.</span></h1><p className="mt-3 text-sm text-muted-foreground">{items.length} {items.length===1?'title':'titles'} waiting for you.</p>{items.length ? <div className="stagger mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{items.map(item=><div key={item.id} className="relative"><PosterCard item={item} onToast={setToast}/><button onClick={()=>{toggle(item.id);setToast('Removed from your shelf');}} data-testid={`button-remove-watchlist-${item.id}`} className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary"><X size={12}/> Remove</button></div>)}</div> : <EmptyState title="A quiet shelf" description="Save films and dramas while you browse. They’ll wait here for the right night." href="/movies" label="Explore movies" />}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function Profile() {
  const [profile, setProfile] = useStored<{name:string;email:string}>('asian-profile',{name:'',email:''});
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [form, setForm] = useState(profile);
  const [toast, setToast] = useState('');
  const [watchIds] = useIds('asian-watchlist');
  const [favoriteDramas] = useIds('asian-favorite-dramas');
  const [favoriteMovies] = useIds('asian-favorite-movies');
  const submit = (e: React.FormEvent) => { e.preventDefault(); if(mode==='forgot'){setToast('A reset link would be sent in the full product.');return;} if(!form.email){setToast('Enter an email to continue.');return;} setProfile({...form,name:form.name || form.email.split('@')[0]}); setToast(mode==='register'?'Your shelf is ready.':'Welcome back to the archive.'); };
  const logged = Boolean(profile.email);
  return <Shell><Meta title="My shelf / Profile" description="Manage your Asian Screen profile and personal shelves." /><div className="page-enter"><div className="border-b border-border pb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">Personal archive</p><h1 className="mt-3 font-display text-6xl italic md:text-8xl">{logged ? `Hello, ${profile.name}.` : 'Your shelf.'}</h1><p className="mt-3 text-sm text-muted-foreground">{logged ? 'Keep the stories you want close.' : 'Sign in to keep your watchlist, progress and favorites in one place.'}</p></div>{!logged ? <div className="mt-10 max-w-md border border-border bg-card p-6"><div className="mb-6 flex gap-4 border-b border-border text-xs uppercase tracking-widest">{(['login','register','forgot'] as const).map(item=><button key={item} onClick={()=>setMode(item)} data-testid={`button-profile-${item}`} className={`pb-3 ${mode===item?'border-b-2 border-primary text-foreground':'text-muted-foreground'}`}>{item}</button>)}</div><form onSubmit={submit} className="space-y-4">{mode==='register'&&<input data-testid="input-profile-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" className="h-11 w-full border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" />}<input data-testid="input-profile-email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email address" className="h-11 w-full border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" />{mode!=='forgot'&&<input data-testid="input-profile-password" type="password" placeholder="Password" className="h-11 w-full border border-border bg-secondary px-3 text-sm outline-none focus:border-primary" />}<Button type="submit" testId="button-profile-submit" className="w-full">{mode==='forgot'?'Send reset link':mode==='register'?'Create account':'Enter the archive'}</Button></form></div> : <div className="mt-10 grid gap-4 sm:grid-cols-3"><Stat label="On your shelf" value={watchIds.length} href="/watchlist" /><Stat label="Favorite dramas" value={favoriteDramas.length} href="/series" /><Stat label="Favorite movies" value={favoriteMovies.length} href="/movies" /><button onClick={()=>{setProfile({name:'',email:''});setToast('Signed out.');}} data-testid="button-signout" className="border border-border p-5 text-left text-xs uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-primary"><Settings size={18} className="mb-4" /> Sign out</button></div>}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function Stat({label,value,href}:{label:string;value:number;href:string}) { return <Link href={href} data-testid={`link-stat-${label.toLowerCase().replaceAll(' ','-')}`} className="border border-border bg-card p-5 transition hover:border-primary"><p className="font-mono-ui text-3xl text-accent">{value}</p><p className="mt-8 text-xs uppercase tracking-widest text-muted-foreground">{label}</p></Link>; }

function Admin() {
  const [localTitles, setLocalTitles] = useStored<Title[]>('asian-admin-titles', titles);
  const [editing, setEditing] = useState<Title | null>(null);
  const [toast,setToast] = useState('');
  const remove = (id:string) => { if(window.confirm('Delete this title from the prototype catalogue?')) {setLocalTitles(prev=>prev.filter(t=>t.id!==id));setToast('Title deleted.');} };
  const save = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if(!editing)return; setLocalTitles(prev=>prev.some(t=>t.id===editing.id)?prev.map(t=>t.id===editing.id?editing:t):[editing,...prev]); setEditing(null);setToast('Catalogue saved.'); };
  const blank: Title = {id:`as-${Date.now()}`,title:'Untitled story',originalTitle:'',type:'movie',country:'Korea',year:2024,rating:7.5,genres:['Drama'],description:'A new demo title for the catalogue.',poster:titles[0].poster,backdrop:titles[0].backdrop,trailer:titles[0].trailer,language:'Korean',status:'Completed',seasons:0,episodes:1,cast:['New cast'],director:'New director',popularity:50,hd:'HD'};
  return <Shell><Meta title="Admin / Catalogue room" description="Prototype admin catalogue management." /><div className="page-enter"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">Backstage / prototype</p><h1 className="mt-3 font-display text-6xl italic md:text-8xl">Catalogue room.</h1></div><Button onClick={()=>setEditing(blank)} testId="button-admin-add"><Plus size={15}/> Add title</Button></div><div className="mt-8 grid gap-3 sm:grid-cols-4"><AdminStat label="Titles" value={localTitles.length}/><AdminStat label="Dramas" value={localTitles.filter(t=>t.type==='series').length}/><AdminStat label="Movies" value={localTitles.filter(t=>t.type==='movie').length}/><AdminStat label="Genres" value={genres.length}/></div><div className="mt-10 overflow-x-auto border border-border"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-secondary text-[10px] uppercase tracking-widest text-muted-foreground"><tr><th className="p-4">Title</th><th>Type</th><th>Country</th><th>Year</th><th>Rating</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{localTitles.slice(0,25).map(item=><tr key={item.id} data-testid={`row-admin-title-${item.id}`} className="border-t border-border"><td className="p-4 font-medium">{item.title}</td><td className="text-muted-foreground">{item.type}</td><td className="text-muted-foreground">{item.country}</td><td className="text-muted-foreground">{item.year}</td><td className="text-accent">★ {item.rating}</td><td className="p-4 text-right"><button onClick={()=>setEditing(item)} data-testid={`button-admin-edit-${item.id}`} className="mr-3 text-muted-foreground hover:text-foreground"><Pencil size={15}/></button><button onClick={()=>remove(item.id)} data-testid={`button-admin-delete-${item.id}`} className="text-muted-foreground hover:text-primary"><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></div>{editing&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5"><form onSubmit={save} className="max-h-[90vh] w-full max-w-xl overflow-auto border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-display text-2xl italic">{editing.title==='Untitled story'?'Add title':'Edit title'}</h2><button type="button" onClick={()=>setEditing(null)} data-testid="button-admin-close"><X size={18}/></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{[['title','Title'],['originalTitle','Original title'],['director','Director'],['year','Year'],['rating','Rating'],['description','Description']].map(([key,label])=><label key={key} className={key==='description'?'sm:col-span-2':''}><span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>{key==='description'?<textarea data-testid={`input-admin-${key}`} value={String(editing[key as keyof Title])} onChange={e=>setEditing({...editing,[key]:e.target.value})} className="min-h-24 w-full border border-border bg-secondary p-3 text-sm outline-none"/>:<input data-testid={`input-admin-${key}`} value={String(editing[key as keyof Title])} onChange={e=>setEditing({...editing,[key]:key==='year'||key==='rating'?Number(e.target.value):e.target.value} as Title)} className="h-10 w-full border border-border bg-secondary px-3 text-sm outline-none"/>}</label>)}</div><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={()=>setEditing(null)} testId="button-admin-cancel">Cancel</Button><Button type="submit" testId="button-admin-save">Save changes</Button></div></form></div>}{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</Shell>;
}

function AdminStat({label,value}:{label:string;value:number}) { return <div className="border border-border bg-card p-4"><p className="font-mono-ui text-2xl text-accent">{value}</p><p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p></div>; }

function NotFound() { return <Shell><div className="grid min-h-[60vh] place-items-center text-center"><div><p className="font-mono-ui text-xs uppercase tracking-[.3em] text-primary">404 / Lost reel</p><h1 className="mt-5 font-display text-6xl italic">Nothing playing here.</h1><Link href="/" data-testid="link-not-found-home" className="mt-8 inline-flex items-center gap-2 border border-border px-4 py-3 text-xs uppercase tracking-widest hover:border-primary"><ArrowLeft size={14}/> Back to home</Link></div></div></Shell>; }

function Router() {
  return <Switch><Route path="/" component={Home}/><Route path="/movies"><Catalog type="movie"/></Route><Route path="/series/upcoming"><Shell><Meta title="الدراما القادمة" description="اكتشف الدراما الآسيوية القادمة على Asian Screen." /><DramaListingPage status="Upcoming" title="الدراما القادمة" description="قصص آسيوية جديدة تستعد للوصول إلى رف Asian Screen." /></Shell></Route><Route path="/series/airing"><Shell><Meta title="الدراما التي تبث حالياً" description="تابع الدراما الآسيوية التي تبث حالياً على Asian Screen." /><DramaListingPage status="Ongoing" title="الدراما التي تبث حالياً" description="تابع القصص التي ما زالت تنبض بحلقات جديدة الآن." /></Shell></Route><Route path="/series/completed"><Shell><Meta title="الدراما المنتهية مؤخراً" description="اكتشف الدراما الآسيوية المكتملة مؤخراً على Asian Screen." /><DramaListingPage status="Completed" title="الدراما المنتهية مؤخراً" description="أعمال مكتملة تستحق جلسة مشاهدة هادئة من البداية إلى النهاية." /></Shell></Route><Route path="/series"><Catalog type="series"/></Route><Route path="/episodes" component={NewEpisodesPage}/>{countries.map(c=><Route key={c} path={`/country/${c.toLowerCase()}`}><CountryPage country={c}/></Route>)}<Route path="/genres" component={GenresPage}/><Route path="/genre/:genre" component={GenrePage}/><Route path="/search" component={SearchPage}/><Route path="/movie/:id"><Detail type="movie"/></Route><Route path="/series/:id"><Detail type="series"/></Route><Route path="/watch/:id"><Watch item={undefined}/></Route><Route path="/watchlist" component={Watchlist}/><Route path="/profile" component={Profile}/><Route path="/admin" component={Admin}/><Route component={NotFound}/></Switch>;
}

function App() {
  return <ErrorBoundary><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter><Toaster/></TooltipProvider></ErrorBoundary>;
}

export default App;