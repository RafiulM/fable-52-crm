import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teamProfiles, user } from "@/db/schema";

// Nama tim yang tampil sebelum pemilik mengisinya sendiri.
export const DEFAULT_TEAM_NAME = "Tim Sales";

// Profil akun yang sedang masuk: nama, email untuk masuk, dan nama tim.
export async function getProfile(userId: string) {
  const [row] = await db
    .select({
      name: user.name,
      email: user.email,
      teamName: teamProfiles.teamName,
    })
    .from(user)
    .leftJoin(teamProfiles, eq(teamProfiles.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) return null;
  return { ...row, teamName: row.teamName ?? DEFAULT_TEAM_NAME };
}

export async function saveTeamName(userId: string, teamName: string) {
  await db
    .insert(teamProfiles)
    .values({ userId, teamName })
    .onConflictDoUpdate({
      target: teamProfiles.userId,
      set: { teamName, updatedAt: new Date() },
    });
}
