import { apiHandler } from "@/lib/api/handler";
import { getSession } from "@/lib/auth/session";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session.loggedIn || !session.userId) {
    return { loggedIn: false };
  }
  return { loggedIn: true, user: { id: session.userId, email: session.email } };
});
