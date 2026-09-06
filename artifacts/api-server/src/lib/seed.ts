import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, adminUsersTable, episodesTable, genresTable, seasonsTable, titleGenresTable, titlesTable } from "@workspace/db";
import { titles as legacy } from "../../../asian-screen/src/lib/data";
import { hashPassword } from "./security";
import { logger } from "./logger";
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const status = (s: string) => s === "Upcoming" ? "upcoming" : s === "Ongoing" ? "airing" : "completed";
export async function seed() {
  const [one] = await db.select({ id: titlesTable.id }).from(titlesTable).limit(1);
  if (!one) {
    const names = [...new Set(legacy.flatMap(x => x.genres))];
    await db.insert(genresTable).values(names.map(name => ({ id: randomUUID(), name, slug: slug(name) })));
    const genreRows = await db.select().from(genresTable);
    await db.insert(titlesTable).values(legacy.map(x => ({ id: x.id, title: x.title, originalTitle: x.originalTitle, slug: slug(x.title), description: x.description, type: x.type, country: x.country, year: x.year, status: status(x.status), rating: x.rating, poster: x.poster, backdrop: x.backdrop, language: x.language, director: x.director, cast: x.cast, trailer: x.trailer })));
    await db.insert(titleGenresTable).values(legacy.flatMap(x => x.genres.map(name => { const g = genreRows.find(y => y.name === name); return g ? { titleId: x.id, genreId: g.id } : []; }).flat()));
    for (const x of legacy.filter(y => y.type === "series")) {
      const seasonId = randomUUID();
      await db.insert(seasonsTable).values({ id: seasonId, seriesId: x.id, seasonNumber: 1, title: "الموسم 1" });
      await db.insert(episodesTable).values(Array.from({ length: Math.max(1, x.episodes) }, (_, i) => ({ id: randomUUID(), seasonId, episodeNumber: i + 1, title: `الحلقة ${i + 1}`, description: null, releaseDate: null })));
    }
    logger.info({ count: legacy.length }, "Seeded catalogue");
  }
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const [existing] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.email, email)).limit(1);
    if (!existing) await db.insert(adminUsersTable).values({ id: randomUUID(), email, passwordHash: await hashPassword(password), role: "admin" });
  } else logger.warn("Set ADMIN_EMAIL and ADMIN_PASSWORD to enable admin login");
}