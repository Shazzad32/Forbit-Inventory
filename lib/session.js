import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verifySessionToken } from "./auth";

export async function isAuthed() {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

/** Call at the top of every server action. The proxy already blocks
 *  anonymous page loads; this protects the actions themselves too. */
export async function assertAuth() {
  if (!(await isAuthed())) redirect("/login");
}
