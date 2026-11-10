import { ApiError, readJson, withApiSession } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getProfile, saveTeamName } from "@/services/profile.service";
import { updateProfileSchema } from "@/validators/profile";

export const runtime = "nodejs";

const missing = () => new ApiError(404, "NOT_FOUND", "Akun tidak ditemukan.");

// GET /api/profile — nama, email untuk masuk, dan nama tim akun ini.
export function GET(request: Request) {
  return withApiSession(request, async (session) => {
    const profile = await getProfile(session.user.id);
    if (!profile) throw missing();
    return Response.json({ data: profile });
  });
}

// PATCH /api/profile — mengubah nama pengguna dan/atau nama tim.
// Nama pengguna disimpan lewat Better Auth supaya sesi ikut memakai nama baru.
export function PATCH(request: Request) {
  return withApiSession(request, async (session) => {
    const input = updateProfileSchema.parse(await readJson(request));
    if (input.name !== undefined)
      await auth.api.updateUser({
        body: { name: input.name },
        headers: request.headers,
      });
    if (input.teamName !== undefined)
      await saveTeamName(session.user.id, input.teamName);
    const profile = await getProfile(session.user.id);
    if (!profile) throw missing();
    return Response.json({ data: profile });
  });
}
