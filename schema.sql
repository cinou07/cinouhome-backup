CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  name TEXT NOT NULL,
  picture TEXT,
  text TEXT NOT NULL,
  time INTEGER NOT NULL,
  google_sub TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- One row per (comment, person who liked it). The primary key doubles as
-- the "already liked?" check and stops the same person liking twice.
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id TEXT NOT NULL,
  google_sub TEXT NOT NULL,
  time INTEGER NOT NULL,
  PRIMARY KEY (comment_id, google_sub)
);

CREATE INDEX IF NOT EXISTS idx_likes_comment ON comment_likes(comment_id);