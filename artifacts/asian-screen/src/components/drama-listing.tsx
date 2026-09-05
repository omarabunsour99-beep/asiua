import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useLocation } from 'wouter';
import { countries, genres, titles, type Title } from '@/lib/data';
import { PosterCard } from '@/components/media-components';

export type DramaStatus = 'Upcoming' | 'Ongoing' | 'Completed';

const statusLabels: Record<DramaStatus, string> = {
  Upcoming: 'قريباً',
  Ongoing: 'يبث حالياً',
  Completed: 'مكتمل',
};

const countryLabels: Record<string, string> = {
  Korea: 'الدراما الكورية',
  China: 'الدراما الصينية',
  Japan: 'الدراما اليابانية',
  Thailand: 'الدراما التايلاندية',
  Taiwan: 'الدراما التايوانية',
};

const genreLabels: Record<string, string> = {
  Action: 'أكشن',
  Adventure: 'مغامرات',
  Comedy: 'كوميدي',
  Crime: 'جريمة',
  Drama: 'دراما',
  Family: 'عائلي',
  Mystery: 'غموض',
  Music: 'موسيقي',
  Period: 'تاريخي',
  Political: 'سياسي',
  Romance: 'رومانسي',
  Slice: 'حياة يومية',
  'Slice of Life': 'حياة يومية',
  Thriller: 'إثارة',
  Urban: 'مدني',
};

const PAGE_SIZE = 12;

function readFilters(search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return {
    country: params.get('country') || '',
    genre: params.get('genre') || '',
    year: params.get('year') || '',
    page: Math.max(1, Number(params.get('page')) || 1),
  };
}

function statusText(status: DramaStatus) {
  return statusLabels[status];
}

function ListingHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-border pb-8" dir="rtl">
      <p className="font-mono-ui text-[10px] tracking-[.2em] text-primary">ASIAN SCREEN / دراما حية</p>
      <h1 data-testid="text-drama-listing-title" className="mt-3 font-display text-4xl text-foreground sm:text-5xl md:text-6xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function DramaFilters({
  status,
  values,
  years,
  onChange,
  onApply,
  onReset,
}: {
  status: DramaStatus;
  values: { country: string; genre: string; year: string };
  years: number[];
  onChange: (key: 'country' | 'genre' | 'year', value: string) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <form dir="rtl" onSubmit={(event) => { event.preventDefault(); onApply(); }} className="mt-7 border-y border-border bg-card/30 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-foreground">
        <SlidersHorizontal size={15} className="text-primary" />
        تصفية النتائج
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto]">
        <label className="flex min-w-0 flex-col gap-2 text-[11px] text-muted-foreground">
          التصنيف
          <select data-testid="select-drama-country" value={values.country} onChange={(event) => onChange('country', event.target.value)} className="h-11 w-full border border-border bg-secondary px-3 text-xs text-foreground outline-none transition focus:border-primary">
            <option value="">كل التصنيفات</option>
            {countries.map((country) => <option key={country} value={country}>{countryLabels[country]}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-[11px] text-muted-foreground">
          الحالة
          <select data-testid="select-drama-status" value={status} disabled className="h-11 w-full cursor-not-allowed border border-border bg-secondary/60 px-3 text-xs text-foreground opacity-90">
            <option value={status}>{statusText(status)} · حسب الصفحة</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-[11px] text-muted-foreground">
          النوع
          <select data-testid="select-drama-genre" value={values.genre} onChange={(event) => onChange('genre', event.target.value)} className="h-11 w-full border border-border bg-secondary px-3 text-xs text-foreground outline-none transition focus:border-primary">
            <option value="">كل الأنواع</option>
            {genres.map((genre) => <option key={genre} value={genre}>{genreLabels[genre] || genre}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-[11px] text-muted-foreground">
          السنة
          <select data-testid="select-drama-year" value={values.year} onChange={(event) => onChange('year', event.target.value)} className="h-11 w-full border border-border bg-secondary px-3 text-xs text-foreground outline-none transition focus:border-primary">
            <option value="">كل السنوات</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" data-testid="button-apply-drama-filters" className="inline-flex h-11 flex-1 items-center justify-center gap-2 bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 sm:flex-none">
            تطبيق الاختيار
          </button>
          <button type="button" onClick={onReset} data-testid="button-reset-drama-filters" aria-label="إعادة ضبط الفلاتر" className="grid h-11 w-11 shrink-0 place-items-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}

function DramaCard({ item, onToast }: { item: Title; onToast: (message: string) => void }) {
  return (
    <div className="relative" data-testid={`drama-card-${item.id}`}>
      <PosterCard item={item} onToast={onToast} />
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground" dir="rtl">
        <span>{item.year}</span>
        <span className="text-primary">{statusText(item.status)}</span>
        <span className="truncate">{countryLabels[item.country]}</span>
      </div>
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div data-testid="drama-listing-loading" className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: PAGE_SIZE }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[2/3] bg-secondary" /><div className="mt-3 h-4 w-3/4 bg-secondary" /><div className="mt-2 h-3 w-1/2 bg-secondary" /></div>)}
    </div>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div data-testid="drama-listing-empty" className="mx-auto mt-10 max-w-lg border border-dashed border-border px-6 py-14 text-center" dir="rtl">
      <Search className="mx-auto text-accent" size={24} />
      <h2 className="mt-5 font-display text-2xl">لا توجد دراما مطابقة للفلاتر المحددة</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">جرّب تصنيفاً أو نوعاً أو سنة مختلفة للعثور على قصتك التالية.</p>
      <button type="button" onClick={onReset} data-testid="button-empty-reset-drama-filters" className="mt-6 inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary">
        <RotateCcw size={14} />
        إعادة ضبط الفلاتر
      </button>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (nextPage: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav dir="rtl" aria-label="صفحات الدراما" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} data-testid="button-drama-pagination-previous" className="inline-flex h-9 items-center gap-1 border border-border px-3 text-xs text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
        <ChevronRight size={14} />
        السابق
      </button>
      {pages.map((value) => <button type="button" key={value} onClick={() => onChange(value)} data-testid={`button-drama-pagination-${value}`} aria-current={page === value ? 'page' : undefined} className={`grid h-9 w-9 place-items-center border text-xs transition ${page === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>{value}</button>)}
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} data-testid="button-drama-pagination-next" className="inline-flex h-9 items-center gap-1 border border-border px-3 text-xs text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
        التالي
        <ChevronLeft size={14} />
      </button>
    </nav>
  );
}

export function DramaListingPage({ status, title, description }: { status: DramaStatus; title: string; description: string }) {
  const [location, setLocation] = useLocation();
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const applied = useMemo(() => readFilters(search), [search]);
  const [draft, setDraft] = useState({ country: applied.country, genre: applied.genre, year: applied.year });
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const years = useMemo(() => Array.from(new Set(titles.filter((item) => item.type === 'series').map((item) => item.year))).sort((a, b) => b - a), []);

  useEffect(() => {
    setDraft({ country: applied.country, genre: applied.genre, year: applied.year });
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, [applied.country, applied.genre, applied.year, applied.page]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => titles
    .filter((item) => item.type === 'series' && item.status === status)
    .filter((item) => !applied.country || item.country === applied.country)
    .filter((item) => !applied.genre || item.genres.includes(applied.genre))
    .filter((item) => !applied.year || String(item.year) === applied.year)
    .sort((a, b) => b.year - a.year || b.popularity - a.popularity), [applied.country, applied.genre, applied.year, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(applied.page, totalPages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateUrl = (next: { country?: string; genre?: string; year?: string; page?: number }) => {
    const params = new URLSearchParams();
    const values = { country: applied.country, genre: applied.genre, year: applied.year, page: applied.page, ...next };
    if (values.country) params.set('country', values.country);
    if (values.genre) params.set('genre', values.genre);
    if (values.year) params.set('year', values.year);
    if (values.page > 1) params.set('page', String(values.page));
    const query = params.toString();
    setLocation(query ? `${location.split('?')[0]}?${query}` : location.split('?')[0]);
  };

  const applyFilters = () => updateUrl({ ...draft, page: 1 });
  const resetFilters = () => {
    setDraft({ country: '', genre: '', year: '' });
    updateUrl({ country: '', genre: '', year: '', page: 1 });
  };

  return (
    <div className="page-enter" dir="rtl">
      <ListingHeader title={title} description={description} />
      <DramaFilters status={status} values={draft} years={years} onChange={(key, value) => setDraft((previous) => ({ ...previous, [key]: value }))} onApply={applyFilters} onReset={resetFilters} />
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span data-testid="text-drama-results-count">{filtered.length} عمل</span>
        <span className="inline-flex items-center gap-1.5 text-[11px]"><Check size={13} className="text-primary" /> {statusText(status)}</span>
      </div>
      {loading ? <ListingSkeleton /> : visible.length ? <div data-testid="grid-drama-results" className="stagger mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{visible.map((item) => <DramaCard key={item.id} item={item} onToast={setToast} />)}</div> : <EmptyResults onReset={resetFilters} />}
      {!loading && visible.length > 0 && <Pagination page={page} totalPages={totalPages} onChange={(nextPage) => updateUrl({ page: nextPage })} />}
      {toast && <div data-testid="drama-listing-toast" className="fixed right-4 top-20 z-40 border border-primary/40 bg-card/95 px-4 py-3 text-sm shadow-2xl shadow-black/30 backdrop-blur-md">{toast}</div>}
    </div>
  );
}