import { apiHandler } from "@/lib/api/handler";
import { getSession } from "@/lib/auth/session";

export const POST = apiHandler(async () => {
  const session = await getSession();
  session.destroy();
  return { ok: true };
});
