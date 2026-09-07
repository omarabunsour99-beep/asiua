import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, House, Menu, Search, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { usePublicTitles, toLegacyTitle } from '@/lib/api';

const dramaLinks = [
  { href: '/series', label: 'قائمة الدراما' },
  { href: '/series/upcoming', label: 'الدراما القادمة' },
  { href: '/series/airing', label: 'الدراما التي تبث حاليا' },
  { href: '/series/completed', label: 'الدراما المنتهية مؤخرا' },
  { href: '/country/korea', label: 'الدراما الكورية' },
  { href: '/country/japan', label: 'الدراما اليابانية' },
  { href: '/series', label: 'الدراما الصينية والتايوانية' },
  { href: '/country/thailand', label: 'الدراما التايلاندية' },
];

function isCurrentRoute(location: string, href: string) {
  return href === '/' ? location === '/' : location.startsWith(href);
}

function BrandMark() {
  return (
    <Link href="/" data-testid="link-header-logo" className="group flex items-center gap-3" aria-label="العودة إلى الرئيسية">
      <span className="grid h-9 w-9 place-items-center border border-primary/60 bg-primary font-display text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 transition group-hover:shadow-primary/40">
        AS
      </span>
      <span className="hidden text-[13px] font-semibold tracking-[.24em] text-foreground sm:block">ASIAN SCREEN</span>
    </Link>
  );
}

function HeaderLink({ href, children, active }: { href: string; children: ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      data-testid={`link-header-${href === '/' ? 'home' : href.replaceAll('/', '-').replace(/^-/, '')}`}
      className={`relative flex items-center gap-1.5 whitespace-nowrap px-2 py-3 text-[12px] font-medium transition ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      <span className={`absolute inset-x-2 bottom-0 h-px origin-right bg-primary transition-transform ${active ? 'scale-x-100' : 'scale-x-0'}`} />
    </Link>
  );
}

export default function SiteHeader() {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDramaOpen, setMobileDramaOpen] = useState(false);
  const [dramaOpen, setDramaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsQuery = usePublicTitles({ q: query.trim(), page: 1, pageSize: 5 });

  const suggestions = query.trim()
    ? suggestionsQuery.items.map(toLegacyTitle)
    : [];

  useEffect(() => {
    if (!searchOpen) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', closeWithEscape);
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => {
      document.removeEventListener('keydown', closeWithEscape);
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDramaOpen(false);
      setMobileOpen(false);
      setMobileDramaOpen(false);
    };
    document.addEventListener('keydown', closeMenus);
    return () => document.removeEventListener('keydown', closeMenus);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileDramaOpen(false);
    setDramaOpen(false);
  }, [location]);

  const submitSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false);
    setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileDramaOpen(false);
  };

  return (
    <header dir="rtl" className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-4 sm:gap-5 sm:px-5 lg:px-10">
        <button
          type="button"
          data-testid="button-mobile-menu"
          aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={mobileOpen}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <BrandMark />

        <nav dir="rtl" aria-label="التنقل الرئيسي" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex xl:gap-2">
          <HeaderLink href="/" active={isCurrentRoute(location, '/')}>
            <House size={15} />
            الرئيسية
          </HeaderLink>
           <HeaderLink href="/episodes" active={isCurrentRoute(location, '/episodes')}>
            الحلقات الجديدة
          </HeaderLink>
          <div className="relative" onMouseEnter={() => setDramaOpen(true)} onMouseLeave={() => setDramaOpen(false)}>
            <button
              type="button"
              data-testid="button-drama-dropdown"
              aria-haspopup="menu"
              aria-expanded={dramaOpen}
              onClick={() => setDramaOpen((open) => !open)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap px-2 py-3 text-[12px] font-medium transition ${
               isCurrentRoute(location, '/series') || location.startsWith('/country/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              الدراما الآسيوية
              <ChevronDown size={14} className={`transition-transform ${dramaOpen ? 'rotate-180' : ''}`} />
              <span className={`absolute inset-x-2 bottom-0 h-px origin-right bg-primary transition-transform ${isCurrentRoute(location, '/series') || location.startsWith('/country/') ? 'scale-x-100' : 'scale-x-0'}`} />
            </button>
            {dramaOpen && (
              <div dir="rtl" className="absolute right-0 top-full w-64 origin-top-right border border-border bg-card/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl page-enter" role="menu" data-testid="menu-drama-dropdown">
                {dramaLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    data-testid={`link-drama-${item.label}`}
                    className="flex items-center justify-between border-b border-border/60 px-3 py-2.5 text-xs text-muted-foreground last:border-0 hover:bg-secondary hover:text-foreground"
                    role="menuitem"
                  >
                    <span>{item.label}</span>
                    <ChevronLeft size={13} className="text-primary/70" />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <HeaderLink href="/movies" active={isCurrentRoute(location, '/movies')}>
            الأفلام الآسيوية
          </HeaderLink>
          <HeaderLink href="/genres" active={isCurrentRoute(location, '/genres')}>
            التصنيفات
          </HeaderLink>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            data-testid="button-header-search"
            aria-label="فتح البحث"
            onClick={() => setSearchOpen(true)}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Search size={19} />
          </button>
          <Link
            href="/profile"
            data-testid="link-header-profile"
            aria-label="الملف الشخصي"
            className="flex items-center gap-2 rounded-sm border border-border px-2.5 py-2 text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
          >
            <UserRound size={16} />
            <span className="hidden text-xs sm:block">قائمتي</span>
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="إغلاق القائمة"
            data-testid="button-mobile-overlay"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
            onClick={closeMobile}
          />
          <aside dir="rtl" className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,360px)] flex-col border-l border-border bg-card shadow-2xl shadow-black/60 lg:hidden page-enter" aria-label="قائمة الهاتف">
            <div className="flex items-center justify-between border-b border-border px-5 py-5">
              <BrandMark />
              <button type="button" data-testid="button-mobile-close" aria-label="إغلاق القائمة" onClick={closeMobile} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X size={19} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="التنقل على الهاتف">
              <Link href="/" onClick={closeMobile} data-testid="link-mobile-home-ar" className={`flex items-center gap-3 border-b border-border/60 px-3 py-4 text-sm ${isCurrentRoute(location, '/') ? 'text-primary' : 'text-muted-foreground'}`}>
                <House size={16} />
                الرئيسية
              </Link>
               <Link href="/episodes" onClick={closeMobile} data-testid="link-mobile-new-episodes" className={`flex items-center border-b border-border/60 px-3 py-4 text-sm ${isCurrentRoute(location, '/episodes') ? 'text-primary' : 'text-muted-foreground'}`}>
                الحلقات الجديدة
              </Link>
              <div className="border-b border-border/60">
                <button type="button" data-testid="button-mobile-drama-toggle" aria-expanded={mobileDramaOpen} onClick={() => setMobileDramaOpen((open) => !open)} className="flex w-full items-center justify-between px-3 py-4 text-sm text-muted-foreground hover:text-foreground">
                  <span>الدراما الآسيوية</span>
                  <ChevronDown size={16} className={`transition-transform ${mobileDramaOpen ? 'rotate-180 text-primary' : ''}`} />
                </button>
                {mobileDramaOpen && (
                  <div className="mb-3 border-r border-primary/40 pr-3 page-enter">
                    {dramaLinks.map((item) => (
                      <Link key={item.label} href={item.href} onClick={closeMobile} data-testid={`link-mobile-drama-${item.label}`} className="flex items-center justify-between px-3 py-3 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                        {item.label}
                        <ChevronLeft size={13} className="text-primary/70" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/movies" onClick={closeMobile} data-testid="link-mobile-movies-ar" className={`flex items-center border-b border-border/60 px-3 py-4 text-sm ${isCurrentRoute(location, '/movies') ? 'text-primary' : 'text-muted-foreground'}`}>
                الأفلام الآسيوية
              </Link>
              <Link href="/genres" onClick={closeMobile} data-testid="link-mobile-entertainment-ar" className={`flex items-center border-b border-border/60 px-3 py-4 text-sm ${isCurrentRoute(location, '/genres') ? 'text-primary' : 'text-muted-foreground'}`}>
                التصنيفات
              </Link>
            </nav>
          </aside>
        </>
      )}

      {searchOpen && (
        <div
          dir="rtl"
          role="presentation"
          data-testid="search-overlay"
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/75 px-4 pt-[13vh] backdrop-blur-sm page-enter"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="search-dialog-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-2xl border border-border bg-card p-5 shadow-2xl shadow-black/50 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-primary">Asian Screen</p>
                <h2 id="search-dialog-title" className="mt-2 font-display text-3xl italic text-foreground">البحث في Asian Screen</h2>
              </div>
              <button type="button" data-testid="button-close-search" aria-label="إغلاق البحث" onClick={() => setSearchOpen(false)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitSearch} className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input ref={searchInputRef} data-testid="input-header-search-modal" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابدأ البحث..." className="h-12 w-full border border-border bg-secondary/70 pl-4 pr-10 text-sm text-foreground outline-none transition focus:border-primary" />
              </div>
              <button type="submit" data-testid="button-submit-header-search" className="inline-flex items-center gap-2 bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90">
                <Search size={15} />
                بحث
              </button>
            </form>
            {suggestions.length > 0 && (
              <div className="mt-3 border border-border/70 bg-secondary/40" data-testid="list-header-search-suggestions">
                {suggestions.map((item) => (
                  <Link key={item.id} href={`/${item.type}/${item.id}`} onClick={() => setSearchOpen(false)} data-testid={`link-header-suggestion-${item.id}`} className="flex items-center gap-3 border-b border-border/60 px-3 py-3 last:border-0 hover:bg-secondary">
                    <img src={item.poster} alt="" className="h-10 w-8 object-cover" />
                    <span className="text-sm text-foreground">{item.title}</span>
                    <span className="mr-auto text-[10px] text-muted-foreground">{item.country} · {item.year}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </header>
  );
}