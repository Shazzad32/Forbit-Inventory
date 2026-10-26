// IDs of devices that are already connected ("assigned") on the tracking servers.
// A retail device that is connected but not yet paid for is a "due" device.
// URLs and the token come from the environment (same variable names as the old app).
const SOURCES = [
  { name: "Kanaphuli", url: () => process.env.RETAIL_ASSIGN_ID },
  { name: "Tiktiki", url: () => process.env.TIKTIKI_ASSIGN_ID },
];

export const assignConfigured = () => SOURCES.some((s) => s.url());

/**
 * Authorization header value. Reads ASSIGN_API_TOKEN or the old AUTH_TOKEN variable.
 * If the value already starts with "BEARER " it is used as it is (that is how the old .env stored it),
 * otherwise "BEARER " is added in front.
 */
// function readToken() {
//   // AUTH_TOKEN_B64 = the token text in base64: no $ # or quotes, so .env files cannot damage it.
//   const b64 = String(process.env.AUTH_TOKEN_B64 || "").trim();
//   if (b64) return Buffer.from(b64, "base64").toString("utf8").trim();
//   return String(
//     process.env.ASSIGN_API_TOKEN || process.env.AUTH_TOKEN || ""
//   ).trim();
// }

// function readToken() {
//   return String(process.env.AUTH_TOKEN).trim();
// }

function readToken() {
  return String(process.env.AUTH_TOKEN || "").trim();
}

export function authHeader() {
  const raw = readToken();

  if (!raw) return null;

  return /^Bearer\s+\S+/i.test(raw) ? raw : `BEARER ${raw}`;
}

// export function authHeader() {
//   const raw = readToken();
//   if (!raw) return null;
//   return /^bearer\s+\S/i.test(raw) ? raw : `BEARER ${raw}`;
// }

/** Accepts ["id", ...] (or an object of ids) and returns clean strings. */
export function toIds(data) {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object"
    ? Object.values(data)
    : [];
  return list.map((x) => String(x ?? "").trim()).filter(Boolean);
}

async function load(source, timeoutMs) {
  const url = source.url();
  if (!url) return { name: source.name, skipped: true };
  const auth = authHeader();
  if (!auth)
    return {
      name: source.name,
      error: "has no token (set AUTH_TOKEN in the environment)",
    };
  try {
    const res = await fetch(url, {
      headers: { Authorization: auth },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // Server log only. Describes the token's shape so a damaged .env value is easy to spot; never prints the token.
        console.warn(
          `[due list] ${source.name} rejected the token (HTTP ${res.status}). ` +
            `Token as read: ${
              auth.length
            } characters, contains "$": ${auth.includes(
              "$"
            )}, contains "\\": ${auth.includes("\\")}, ` +
            `from ${
              process.env.AUTH_TOKEN_B64
                ? "AUTH_TOKEN_B64"
                : process.env.ASSIGN_API_TOKEN
                ? "ASSIGN_API_TOKEN"
                : "AUTH_TOKEN"
            }`
        );
        throw new Error(`answered HTTP ${res.status} (token rejected)`);
      }
      throw new Error(`answered HTTP ${res.status}`);
    }
    return { name: source.name, ids: toIds(await res.json()) };
  } catch (err) {
    // keep the message short and free of the URL / token
    const why =
      err?.name === "TimeoutError"
        ? "timed out"
        : err?.message?.startsWith("answered")
        ? err.message
        : "could not be reached";
    return { name: source.name, error: why };
  }
}

/**
 * Loads both server lists in parallel.
 * Returns { configured, ids:Set, failed:[{name,error}] } so pages can warn when a list is missing
 * instead of silently showing fewer devices.
 */
export async function getAssignedIds(timeoutMs = 8000) {
  const results = await Promise.all(SOURCES.map((s) => load(s, timeoutMs)));
  const ids = new Set();
  for (const r of results) r.ids?.forEach((id) => ids.add(id));
  return {
    configured: assignConfigured(),
    ids,
    failed: results
      .filter((r) => r.error)
      .map((r) => ({ name: r.name, error: r.error })),
  };
}

// const SOURCES = [
//   {
//     name: "Kanaphuli",
//     url: () => process.env.RETAIL_ASSIGN_ID,
//   },
//   {
//     name: "Tiktiki",
//     url: () => process.env.TIKTIKI_ASSIGN_ID,
//   },
// ];

// function readToken() {
//   return String(process.env.AUTH_TOKEN || "").trim();
// }

// export const assignConfigured = () =>
//   SOURCES.some((source) => Boolean(source.url()?.trim()));

// export function authHeader() {
//   const token = readToken();

//   if (!token) return null;

//   // Avoid adding BEARER twice if the token already includes it.
//   return /^Bearer\s+\S+/i.test(token) ? token : `BEARER ${token}`;
// }

// /**
//  * Accepts an array of IDs or an object containing IDs.
//  */
// export function toIds(data) {
//   const list = Array.isArray(data)
//     ? data
//     : data && typeof data === "object"
//     ? Object.values(data)
//     : [];

//   return list
//     .map((item) => {
//       if (item === null || item === undefined) return "";
//       if (typeof item === "object") return "";
//       return String(item).trim();
//     })
//     .filter(Boolean);
// }

// async function load(source, timeoutMs) {
//   const url = String(source.url() || "").trim();

//   if (!url) {
//     return {
//       name: source.name,
//       skipped: true,
//     };
//   }

//   const authorization = authHeader();

//   if (!authorization) {
//     return {
//       name: source.name,
//       error: "AUTH_TOKEN is missing",
//     };
//   }

//   try {
//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: authorization,
//         Accept: "application/json",
//       },
//       cache: "no-store",
//       signal: AbortSignal.timeout(timeoutMs),
//     });

//     if (!response.ok) {
//       console.error(`[Assigned IDs] ${source.name}: HTTP ${response.status}`);

//       return {
//         name: source.name,
//         error: `HTTP ${response.status}`,
//       };
//     }

//     let data;

//     try {
//       data = await response.json();
//     } catch {
//       return {
//         name: source.name,
//         error: "Invalid JSON response",
//       };
//     }

//     const ids = toIds(data);

//     console.log(`[Assigned IDs] ${source.name}: fetched ${ids.length} IDs`);

//     return {
//       name: source.name,
//       ids,
//     };
//   } catch (error) {
//     const message =
//       error?.name === "TimeoutError" || error?.name === "AbortError"
//         ? "Request timed out"
//         : "Request failed or server unreachable";

//     console.error(`[Assigned IDs] ${source.name}: ${message}`);

//     return {
//       name: source.name,
//       error: message,
//     };
//   }
// }

// /**
//  * Loads both assigned-device lists in parallel.
//  * Returns { configured, ids: Set, failed }.
//  */
// export async function getAssignedIds(timeoutMs = 15000) {
//   const results = await Promise.all(
//     SOURCES.map((source) => load(source, timeoutMs))
//   );

//   const ids = new Set();

//   for (const result of results) {
//     if (result.ids) {
//       result.ids.forEach((id) => ids.add(id));
//     }
//   }

//   return {
//     configured: assignConfigured(),
//     ids,
//     failed: results
//       .filter((result) => result.error)
//       .map(({ name, error }) => ({ name, error })),
//   };
// }
