// Cloudflare Pages Function — /api/comments
// GET  -> returns every top-level comment, nested as { ...comment, replies: [...] },
//         each carrying `likes` (count) and `likedByMe` (only meaningful if the
//         request included a signed-in visitor's credential — see below).
// POST -> creates a comment or reply. Requires a Google ID token ("credential")
//         which is verified here, server-side, before anything is written.
//
// Requires:
//   - a D1 database bound as `DB` (see schema.sql)
//   - an environment variable GOOGLE_CLIENT_ID (same value as the meta tag
//     in index.html) so we can check the token was issued for THIS app.

import { verifyGoogleToken } from "../_utils/verify-google-token.js";

export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, parent_id, name, picture, text, time FROM comments ORDER BY time ASC`
    ).all();

    const { results: likeRows } = await env.DB.prepare(
      `SELECT comment_id, COUNT(*) as cnt FROM comment_likes GROUP BY comment_id`
    ).all();
    const likeCounts = new Map(likeRows.map((r) => [r.comment_id, r.cnt]));

    // If the visitor is signed in, the client sends their ID token as
    // ?credential=... so we can tell them which comments they've already
    // liked (filled-in heart on load). An invalid/missing token just means
    // "treat as signed out" rather than failing the whole page.
    let likedIds = new Set();
    const credential = new URL(request.url).searchParams.get("credential");
    if (credential) {
      const verified = await verifyGoogleToken(credential, env.GOOGLE_CLIENT_ID);
      if (verified.ok) {
        const { results: mine } = await env.DB.prepare(
          `SELECT comment_id FROM comment_likes WHERE google_sub = ?`
        ).bind(verified.payload.sub).all();
        likedIds = new Set(mine.map((r) => r.comment_id));
      }
    }

    const byId = new Map();
    const top = [];

    for (const row of results) {
      byId.set(row.id, {
        id: row.id,
        name: row.name,
        picture: row.picture || null,
        text: row.text,
        time: row.time,
        likes: likeCounts.get(row.id) || 0,
        likedByMe: likedIds.has(row.id),
        replies: [],
      });
    }
    for (const row of results) {
      const item = byId.get(row.id);
      if (row.parent_id) {
        const parent = byId.get(row.parent_id);
        if (parent) parent.replies.push(item);
      } else {
        top.push(item);
      }
    }

    return Response.json(top);
  } catch (err) {
    return Response.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { credential, text, parentId } = body || {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Comment text is required" }, { status: 400 });
  }
  if (text.length > 600) {
    return Response.json({ error: "Comment is too long" }, { status: 400 });
  }

  const verified = await verifyGoogleToken(credential, env.GOOGLE_CLIENT_ID);
  if (!verified.ok) {
    return Response.json({ error: verified.error }, { status: verified.status });
  }
  const payload = verified.payload;

  if (parentId) {
    const parent = await env.DB.prepare(`SELECT id FROM comments WHERE id = ?`).bind(parentId).first();
    if (!parent) {
      return Response.json({ error: "Original comment not found" }, { status: 404 });
    }
  }

  const name = payload.name || payload.given_name || (payload.email ? payload.email.split("@")[0] : "Anonymous");
  const picture = payload.picture || null;
  const sub = payload.sub;
  const id = crypto.randomUUID();
  const time = Date.now();

  await env.DB.prepare(
    `INSERT INTO comments (id, parent_id, name, picture, text, time, google_sub) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, parentId || null, name, picture, text.trim(), time, sub).run();

  return Response.json({ id, name, picture, text: text.trim(), time, likes: 0, likedByMe: false, replies: [] });
}
