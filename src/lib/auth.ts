import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { SESSION_COOKIE, signSession, verifySessionToken, type Session } from "./session";
import type { User } from "@prisma/client";

export type { Session };
export { verifySessionToken };

export async function createSession(user: { id: string; email: string }) {
  const token = await signSession(user);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function readSession(): Promise<Session | null> {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.blockedAt) {
    await destroySession();
    redirect("/login?blocked=1");
  }
  return user;
}
