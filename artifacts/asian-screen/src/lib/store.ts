import { useEffect, useState } from 'react';

const read = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
export const useStored = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => read(key, fallback));
  useEffect(() => { write(key, value); }, [key, value]);
  return [value, setValue] as const;
};
export const toggleStored = (key: string, id: string) => {
  const current = read<string[]>(key, []);
  const next = current.includes(id) ? current.filter(item => item !== id) : [id, ...current];
  write(key, next);
  window.dispatchEvent(new CustomEvent('asian-store-change'));
  return next;
};
export const readStored = <T,>(key: string, fallback: T) => read(key, fallback);