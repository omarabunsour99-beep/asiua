import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, primaryKey, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const adminUsersTable = pgTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({ emailIdx: uniqueIndex("admin_users_email_idx").on(t.email) }));

export const sessionsTable = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull().references(() => adminUsersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const titlesTable = pgTable("titles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull(),
  country: text("country").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull(),
  rating: real("rating").notNull().default(0),
  poster: text("poster").notNull().default(""),
  backdrop: text("backdrop").notNull().default(""),
  language: text("language").notNull().default(""),
  director: text("director").notNull().default(""),
  cast: text("cast").array().notNull().default([]),
  trailer: text("trailer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({ slugIdx: uniqueIndex("titles_slug_idx").on(t.slug) }));

export const genresTable = pgTable("genres", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ slugIdx: uniqueIndex("genres_slug_idx").on(t.slug) }));

export const titleGenresTable = pgTable("title_genres", {
  titleId: text("title_id").notNull().references(() => titlesTable.id, { onDelete: "cascade" }),
  genreId: text("genre_id").notNull().references(() => genresTable.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.titleId, t.genreId] }) }));

export const seasonsTable = pgTable("seasons", {
  id: text("id").primaryKey(),
  seriesId: text("series_id").notNull().references(() => titlesTable.id, { onDelete: "cascade" }),
  seasonNumber: integer("season_number").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({ seriesSeasonIdx: uniqueIndex("seasons_series_number_idx").on(t.seriesId, t.seasonNumber) }));

export const episodesTable = pgTable("episodes", {
  id: text("id").primaryKey(),
  seasonId: text("season_id").notNull().references(() => seasonsTable.id, { onDelete: "cascade" }),
  episodeNumber: integer("episode_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  releaseDate: date("release_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({ seasonEpisodeIdx: uniqueIndex("episodes_season_number_idx").on(t.seasonId, t.episodeNumber) }));

export const watchLinksTable = pgTable("watch_links", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id").notNull().references(() => episodesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTitleSchema = createInsertSchema(titlesTable);
export const insertSeasonSchema = createInsertSchema(seasonsTable);
export const insertEpisodeSchema = createInsertSchema(episodesTable);
export const insertWatchLinkSchema = createInsertSchema(watchLinksTable);
export type AdminUser = typeof adminUsersTable.$inferSelect;
export type Title = typeof titlesTable.$inferSelect;
export type Season = typeof seasonsTable.$inferSelect;
export type Episode = typeof episodesTable.$inferSelect;
export type WatchLink = typeof watchLinksTable.$inferSelect;