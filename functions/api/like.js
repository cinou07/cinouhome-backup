// Cloudflare Pages Function — /api/like
// POST -> toggles the signed-in visitor's like on a comment or reply.
// Requires the same Google ID token ("credential") the comment form uses,
// verified here before anything is written — so liking is real, not just
// a client-side count anyone could fake.

import { verifyGoogleToken } from "../_utils/verify-google-token.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { credential, commentId } = body || {};

  if (!commentId || typeof commentId !== "string") {
    return Response.json({ error: "commentId is required" }, { status: 400 });
  }

  const verified = await verifyGoogleToken(credential, env.GOOGLE_CLIENT_ID);
  if (!verified.ok) {
    return Response.json({ error: verified.error }, { status: verified.status });
  }
  const sub = verified.payload.sub;

  const comment = await env.DB.prepare(`SELECT id FROM comments WHERE id = ?`).bind(commentId).first();
  if (!comment) {
    return Response.json({ error: "Comment not found" }, { status: 404 });
  }

  const existing = await env.DB.prepare(
    `SELECT 1 FROM comment_likes WHERE comment_id = ? AND google_sub = ?`
  ).bind(commentId, sub).first();

  let liked;
  if (existing) {
    await env.DB.prepare(
      `DELETE FROM comment_likes WHERE comment_id = ? AND google_sub = ?`
    ).bind(commentId, sub).run();
    liked = false;
  } else {
    await env.DB.prepare(
      `INSERT INTO comment_likes (comment_id, google_sub, time) VALUES (?, ?, ?)`
    ).bind(commentId, sub, Date.now()).run();
    liked = true;
  }

  const row = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?`
  ).bind(commentId).first();

  return Response.json({ liked, likes: row.count });
}
