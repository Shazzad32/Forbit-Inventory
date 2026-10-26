// Session = "<expiryMs>.<hmac>" in an httpOnly cookie. Uses only Web Crypto,
// so the same code runs in the proxy (middleware) and in server code.
export const COOKIE = "inv_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();
const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(value) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (at least 16 characters). See .env.example");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const sha256 = async (s) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));

export async function createSessionToken() {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== "string") return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, await hmac(exp));
}

/** Compare against ADMIN_EMAIL / ADMIN_PASSWORD without leaking length/timing. */
export async function checkCredentials(email, password) {
  const wantEmail = process.env.ADMIN_EMAIL;
  const wantPass = process.env.ADMIN_PASSWORD;
  if (!wantEmail || !wantPass) throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD are not set");
  const [a, b, c, d] = await Promise.all([
    sha256(String(email).trim().toLowerCase()),
    sha256(wantEmail.trim().toLowerCase()),
    sha256(String(password)),
    sha256(wantPass),
  ]);
  const okEmail = safeEqual(a, b);
  const okPass = safeEqual(c, d);
  return okEmail && okPass;
}
