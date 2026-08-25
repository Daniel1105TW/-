import { cookies } from "next/headers";
import crypto from "node:crypto";

const sessions = new Set<string>();
let passwordHash = "";

export function hasPassword() { return passwordHash.length > 0; }
export function setPassword(password: string) { passwordHash = crypto.createHash("sha256").update(password).digest("hex"); }
export function checkPassword(password: string) { return !passwordHash || crypto.createHash("sha256").update(password).digest("hex") === passwordHash; }
export async function isAdmin() { const token = (await cookies()).get("admin_session")?.value; return !!token && sessions.has(token); }
export async function signIn() { const token = crypto.randomBytes(24).toString("hex"); sessions.add(token); (await cookies()).set("admin_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 }); }
export async function signOut() { const token = (await cookies()).get("admin_session")?.value; if (token) sessions.delete(token); (await cookies()).delete("admin_session"); }
