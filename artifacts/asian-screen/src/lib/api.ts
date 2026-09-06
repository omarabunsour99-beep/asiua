import { useEffect, useState } from "react";
import type { Title } from "@/lib/data";

export type ApiTitle = {
  id: string; title: string; originalTitle: string | null; slug: string; description: string;
  type: "series" | "movie"; country: string; year: number; status: "upcoming" | "airing" | "completed";
  rating: number; poster: string; backdrop: string; language: string; director: string; cast: string[];
  trailer: string | null; genres: string[]; seasonsCount: number; episodesCount: number;
};
export type Season = { id: string; seriesId: string; seasonNumber: number; title: string | null; episodeCount?: number };
export type Episode = { id: string; seasonId: string; episodeNumber: number; title: string; description: string | null; releaseDate: string | null; watchLinkCount?: number };
export type WatchLink = { id: string; episodeId: string; name: string; url: string; sortOrder: number };
export type Overview = { titles: number; series: number; movies: number; seasons: number; episodes: number; genres: number; upcoming: number; airing: number; completed: number };
export type AdminUser = { id: string; email: string; role: string };
export type TitleInput = Omit<ApiTitle, "id" | "genres" | "seasonsCount" | "episodesCount"> & { genres: string[] };
export function toLegacyTitle(x: ApiTitle): Title {
  return { ...x, originalTitle: x.originalTitle ?? "", trailer: x.trailer ?? "", status: x.status === "upcoming" ? "Upcoming" : x.status === "airing" ? "Ongoing" : "Completed", country: x.country as Title["country"], seasons: x.seasonsCount, episodes: x.episodesCount, popularity: x.rating * 10 };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("content-type", "application/json");
  const response = await fetch(`/api${path}`, { ...init, headers, credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.status === 204 ? undefined as T : response.json();
}
const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value !== undefined && value !== "" && search.set(key, String(value)));
  return search.toString() ? `?${search}` : "";
};
export const getAdmin = () => request<AdminUser>("/auth/me");
export const loginAdmin = (email: string, password: string) => request<{ user: AdminUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const logoutAdmin = () => request<void>("/auth/logout", { method: "POST" });
export const getOverview = () => request<Overview>("/admin/overview");
export const listAdminTitles = () => request<{ items: ApiTitle[]; total: number }>("/admin/titles?page=1&pageSize=100");
export const listPublicTitles = (params: Record<string, string | number | undefined> = {}) => request<{ items: ApiTitle[]; total: number }>(`/content/titles${qs(params)}`);
export const getPublicTitle = (id: string) => request<ApiTitle & { seasons: Array<Season & { episodes: Array<Episode & { watchLinks: WatchLink[] }> }> }>(`/content/titles/${encodeURIComponent(id)}`);
export const createTitle = (input: TitleInput) => request<ApiTitle>("/admin/titles", { method: "POST", body: JSON.stringify(input) });
export const updateTitle = (id: string, input: Partial<TitleInput>) => request<ApiTitle>(`/admin/titles/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteTitle = (id: string) => request<void>(`/admin/titles/${id}`, { method: "DELETE" });
export const listSeasons = (id: string) => request<Season[]>(`/admin/titles/${id}/seasons`);
export const addSeason = (id: string, seasonNumber: number) => request<Season>(`/admin/titles/${id}/seasons`, { method: "POST", body: JSON.stringify({ seasonNumber, title: `الموسم ${seasonNumber}` }) });
export const deleteSeason = (id: string) => request<void>(`/admin/seasons/${id}`, { method: "DELETE" });
export const listEpisodes = (id: string) => request<Episode[]>(`/admin/seasons/${id}/episodes`);
export const addEpisode = (id: string, episodeNumber: number, title: string) => request<Episode>(`/admin/seasons/${id}/episodes`, { method: "POST", body: JSON.stringify({ episodeNumber, title }) });
export const deleteEpisode = (id: string) => request<void>(`/admin/episodes/${id}`, { method: "DELETE" });
export const listLinks = (id: string) => request<WatchLink[]>(`/admin/episodes/${id}/watch-links`);
export const addLink = (id: string, name: string, url: string) => request<WatchLink>(`/admin/episodes/${id}/watch-links`, { method: "POST", body: JSON.stringify({ name, url }) });
export const deleteLink = (id: string) => request<void>(`/admin/watch-links/${id}`, { method: "DELETE" });

export function usePublicTitles(params: Record<string, string | number | undefined> = {}) {
  const [items, setItems] = useState<ApiTitle[]>([]); const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params);
  useEffect(() => { let active = true; setLoading(true); listPublicTitles(params).then(x => active && setItems(x.items)).catch(() => active && setItems([])).finally(() => active && setLoading(false)); return () => { active = false; }; }, [key]);
  return { items, loading };
}