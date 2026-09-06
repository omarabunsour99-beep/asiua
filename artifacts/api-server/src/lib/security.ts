import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCb);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [, salt, hex] = stored.split("$");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}