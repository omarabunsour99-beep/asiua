import { Router } from "express";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db, episodesTable, genresTable, seasonsTable, titleGenresTable, titlesTable, watchLinksTable } from "@workspace/db";
import { randomUUID } from "node:crypto";
import { createSession, destroySession, requireAdmin, SESSION_COOKIE, setCookie } from "../lib/auth";
import { hashPassword, verifyPassword } from "../lib/security";
import { adminUsersTable } from "@workspace/db";

const router = Router();
const asNumber = (v: unknown, fallback: number) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const statusMap = (s: string) => s === "upcoming" ? "Upcoming" : s === "airing" ? "Ongoing" : "Completed";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function genreNames(id: string) {
  const rows = await db.select({ name: genresTable.name }).from(titleGenresTable).innerJoin(genresTable, eq(titleGenresTable.genreId, genresTable.id)).where(eq(titleGenresTable.titleId, id));
  return rows.map(x => x.name);
}
async function counts(id: string) {
  const [s, e] = await Promise.all([
    db.select({ n: count() }).from(seasonsTable).where(eq(seasonsTable.seriesId, id)),
    db.select({ n: count() }).from(episodesTable).innerJoin(seasonsTable, eq(episodesTable.seasonId, seasonsTable.id)).where(eq(seasonsTable.seriesId, id)),
  ]);
  return { seasonsCount: Number(s[0]?.n ?? 0), episodesCount: Number(e[0]?.n ?? 0) };
}
async function summary(row: typeof titlesTable.$inferSelect) {
  return { ...row, genres: await genreNames(row.id), ...(await counts(row.id)) };
}
async function detail(id: string) {
  const [row] = await db.select().from(titlesTable).where(eq(titlesTable.id, id)).limit(1);
  if (!row) return null;
  const seasons = await db.select().from(seasonsTable).where(eq(seasonsTable.seriesId, id)).orderBy(asc(seasonsTable.seasonNumber));
  const seasonDetails = await Promise.all(seasons.map(async s => {
    const episodes = await db.select().from(episodesTable).where(eq(episodesTable.seasonId, s.id)).orderBy(asc(episodesTable.episodeNumber));
    const episodeDetails = await Promise.all(episodes.map(async e => ({ ...e, watchLinks: await db.select().from(watchLinksTable).where(eq(watchLinksTable.episodeId, e.id)).orderBy(asc(watchLinksTable.sortOrder)), watchLinkCount: (await db.select({ n: count() }).from(watchLinksTable).where(eq(watchLinksTable.episodeId, e.id)))[0]?.n ?? 0 })));
    return { ...s, episodeCount: episodes.length, episodes: episodeDetails };
  }));
  return { ...(await summary(row)), seasons: seasonDetails };
}
async function list(req: any) {
  const { type, status, country, genre, q } = req.query;
  const page = Math.max(1, asNumber(req.query.page, 1)), pageSize = Math.min(100, Math.max(1, asNumber(req.query.pageSize, 24)));
  const where = [type && eq(titlesTable.type, String(type)), status && eq(titlesTable.status, String(status)), country && eq(titlesTable.country, String(country)), q && or(ilike(titlesTable.title, `%${q}%`), ilike(titlesTable.originalTitle, `%${q}%`))].filter(Boolean) as any[];
  let rows = await db.select().from(titlesTable).where(where.length ? and(...where) : undefined).orderBy(desc(titlesTable.year), asc(titlesTable.title));
  if (req.query.year) rows = rows.filter(x => x.year === Number(req.query.year));
  const full = await Promise.all(rows.map(summary));
  const filtered = genre ? full.filter(x => x.genres.some(g => g.toLowerCase() === String(genre).toLowerCase())) : full;
  return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
}
function titleInput(body: any, partial = false) {
  const required = ["title", "slug", "description", "type", "country", "year", "status", "rating", "poster", "backdrop", "language", "director", "cast", "genres"];
  if (!partial && required.some(k => body[k] === undefined)) return "Missing required title fields";
  if (body.title !== undefined && (!String(body.title).trim() || !["series", "movie"].includes(body.type))) return "Invalid title";
  return null;
}
async function replaceGenres(titleId: string, names: string[]) {
  await db.delete(titleGenresTable).where(eq(titleGenresTable.titleId, titleId));
  for (const name of [...new Set(names.map(String).map(x => x.trim()).filter(Boolean))]) {
    const key = slug(name);
    let [g] = await db.select().from(genresTable).where(eq(genresTable.slug, key)).limit(1);
    if (!g) [g] = await db.insert(genresTable).values({ id: randomUUID(), name, slug: key }).returning();
    await db.insert(titleGenresTable).values({ titleId, genreId: g.id });
  }
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.email, String(email ?? "").toLowerCase())).limit(1);
  if (!user || typeof password !== "string" || !(await verifyPassword(password, user.passwordHash))) { res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }); return; }
  setCookie(res, await createSession(user.id)); res.json({ user: { id: user.id, email: user.email, role: user.role } });
});
router.post("/auth/logout", async (req, res) => { await destroySession(req.cookies?.[SESSION_COOKIE]); res.clearCookie(SESSION_COOKIE, { path: "/" }); res.sendStatus(204); });
router.get("/auth/me", (req, res) => req.adminUser ? res.json(req.adminUser) : res.status(401).json({ error: "Authentication required" }));

router.get("/content/titles", async (req, res) => res.json(await list(req)));
router.get("/content/titles/:id", async (req, res) => { const value = await detail(req.params.id); value ? res.json(value) : res.status(404).json({ error: "Title not found" }); });

router.use("/admin", requireAdmin);
router.get("/admin/overview", async (_req, res) => {
  const values = await Promise.all(["titles", "seasons", "episodes", "genres"].map(async table => {
    const source = { titles: titlesTable, seasons: seasonsTable, episodes: episodesTable, genres: genresTable }[table]!;
    const [r] = await db.select({ n: count() }).from(source); return [table, Number(r?.n ?? 0)] as const;
  }));
  const map = Object.fromEntries(values); const [series] = await db.select({ n: count() }).from(titlesTable).where(eq(titlesTable.type, "series")); const [movies] = await db.select({ n: count() }).from(titlesTable).where(eq(titlesTable.type, "movie"));
  res.json({ ...map, series: Number(series.n), movies: Number(movies.n), upcoming: (await list({ query: { status: "upcoming", page: 1, pageSize: 1 } })).total, airing: (await list({ query: { status: "airing", page: 1, pageSize: 1 } })).total, completed: (await list({ query: { status: "completed", page: 1, pageSize: 1 } })).total });
});
router.get("/admin/titles", async (req, res) => res.json(await list(req)));
router.post("/admin/titles", async (req, res) => {
  const error = titleInput(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const {
    genres,
    id: _ignoredId,
    createdAt: _ignoredCreatedAt,
    updatedAt: _ignoredUpdatedAt,
    ...body
  } = req.body;

  const id = randomUUID();

  const [row] = await db
    .insert(titlesTable)
    .values({ ...body, id })
    .returning();

  await replaceGenres(id, genres);

  res.status(201).json(await detail(row.id));
});

router.patch("/admin/titles/:id", async (req, res) => {
  const error = titleInput(req.body, true);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const [row] = await db
    .select()
    .from(titlesTable)
    .where(eq(titlesTable.id, req.params.id));

  if (!row) {
    res.status(404).json({ error: "Title not found" });
    return;
  }

  const {
    genres,
    id: _ignoredId,
    createdAt: _ignoredCreatedAt,
    updatedAt: _ignoredUpdatedAt,
    ...body
  } = req.body;

  if (Object.keys(body).length) {
    await db
      .update(titlesTable)
      .set(body)
      .where(eq(titlesTable.id, row.id));
  }

  if (genres) await replaceGenres(row.id, genres);

  res.json(await detail(row.id));
});
router.delete("/admin/titles/:id", async (req, res) => { const [row] = await db.delete(titlesTable).where(eq(titlesTable.id, req.params.id)).returning(); row ? res.sendStatus(204) : res.status(404).json({ error: "Title not found" }); });

router.get("/admin/titles/:id/seasons", async (req, res) => res.json(await db.select().from(seasonsTable).where(eq(seasonsTable.seriesId, req.params.id)).orderBy(asc(seasonsTable.seasonNumber))));
router.post("/admin/titles/:id/seasons", async (req, res) => { if (!req.body?.seasonNumber) { res.status(400).json({ error: "seasonNumber required" }); return; } const [s] = await db.insert(seasonsTable).values({ id: randomUUID(), seriesId: req.params.id, seasonNumber: Number(req.body.seasonNumber), title: req.body.title ?? null }).returning(); res.status(201).json({ ...s, episodeCount: 0 }); });
router.delete("/admin/seasons/:id", async (req, res) => { const [s] = await db.delete(seasonsTable).where(eq(seasonsTable.id, req.params.id)).returning(); s ? res.sendStatus(204) : res.status(404).json({ error: "Season not found" }); });
router.get("/admin/seasons/:id/episodes", async (req, res) => res.json(await db.select().from(episodesTable).where(eq(episodesTable.seasonId, req.params.id)).orderBy(asc(episodesTable.episodeNumber))));
router.post("/admin/seasons/:id/episodes", async (req, res) => { if (!req.body?.episodeNumber || !req.body?.title) { res.status(400).json({ error: "episodeNumber and title required" }); return; } const [e] = await db.insert(episodesTable).values({ id: randomUUID(), seasonId: req.params.id, episodeNumber: Number(req.body.episodeNumber), title: req.body.title, description: req.body.description ?? null, releaseDate: req.body.releaseDate ?? null }).returning(); res.status(201).json({ ...e, watchLinkCount: 0 }); });
router.delete("/admin/episodes/:id", async (req, res) => { const [e] = await db.delete(episodesTable).where(eq(episodesTable.id, req.params.id)).returning(); e ? res.sendStatus(204) : res.status(404).json({ error: "Episode not found" }); });
router.get("/admin/episodes/:id/watch-links", async (req, res) => {
  res.json(
    await db
      .select()
      .from(watchLinksTable)
      .where(eq(watchLinksTable.episodeId, req.params.id))
      .orderBy(asc(watchLinksTable.sortOrder))
  );
});

router.post("/admin/episodes/:id/watch-links", async (req, res) => {
  if (!req.body?.name || !req.body?.url) {
    res.status(400).json({ error: "name and url required" });
    return;
  }

  const [w] = await db
    .insert(watchLinksTable)
    .values({
      id: randomUUID(),
      episodeId: req.params.id,
      name: req.body.name,
      url: req.body.url,
      sortOrder: Number(req.body.sortOrder ?? 0),
    })
    .returning();

  res.status(201).json(w);
});

// Movie watch links
router.get("/admin/titles/:id/watch-links", async (req, res) => {
  res.json(
    await db
      .select()
      .from(watchLinksTable)
      .where(eq(watchLinksTable.titleId, req.params.id))
      .orderBy(asc(watchLinksTable.sortOrder))
  );
});

router.post("/admin/titles/:id/watch-links", async (req, res) => {
  if (!req.body?.name || !req.body?.url) {
    res.status(400).json({ error: "name and url required" });
    return;
  }

  const [title] = await db
    .select({ id: titlesTable.id, type: titlesTable.type })
    .from(titlesTable)
    .where(eq(titlesTable.id, req.params.id))
    .limit(1);

  if (!title) {
    res.status(404).json({ error: "Title not found" });
    return;
  }

  if (title.type !== "movie") {
    res.status(400).json({
      error: "Watch links for this endpoint are only for movies",
    });
    return;
  }

  const [w] = await db
    .insert(watchLinksTable)
    .values({
      id: randomUUID(),
      titleId: req.params.id,
      name: req.body.name,
      url: req.body.url,
      sortOrder: Number(req.body.sortOrder ?? 0),
    })
    .returning();

  res.status(201).json(w);
});

router.delete("/admin/watch-links/:id", async (req, res) => {
  const [w] = await db
    .delete(watchLinksTable)
    .where(eq(watchLinksTable.id, req.params.id))
    .returning();

  w
    ? res.sendStatus(204)
    : res.status(404).json({ error: "Watch link not found" });
});

export default router;