// Shared helper — verifies a Google ID token with Google itself and checks
// it was issued for this app. Used by both functions/api/comments.js and
// functions/api/comments/like.js so the check only lives in one place.

export async function verifyGoogleToken(credential, expectedAud) {
  if (!credential || typeof credential !== "string") {
    return { ok: false, status: 401, error: "Not signed in" };
  }

  let payload;
  try {
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) {
      return { ok: false, status: 401, error: "Invalid Google token" };
    }
    payload = await verifyRes.json();
  } catch {
    return { ok: false, status: 502, error: "Could not verify Google token" };
  }

  if (payload.aud !== expectedAud) {
    return { ok: false, status: 401, error: "Token was not issued for this app" };
  }
  if (payload.email_verified === false || payload.email_verified === "false") {
    return { ok: false, status: 401, error: "Email not verified" };
  }
  if (Number(payload.exp) * 1000 < Date.now()) {
    return { ok: false, status: 401, error: "Session expired, please sign in again" };
  }

  return { ok: true, payload };
}
