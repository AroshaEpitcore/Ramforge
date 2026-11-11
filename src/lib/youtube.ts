/**
 * Normalise a YouTube reference to its 11-character video id. Accepts a bare id
 * or any common link shape and returns null if no valid id is found:
 *   - dQw4w9WgXcQ
 *   - https://youtu.be/dQw4w9WgXcQ
 *   - https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s
 *   - https://www.youtube.com/embed/dQw4w9WgXcQ
 *   - https://www.youtube.com/shorts/dQw4w9WgXcQ
 *   - https://www.youtube.com/live/dQw4w9WgXcQ
 */
const ID = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (ID.test(s)) return s;

  let url: URL;
  try {
    url = new URL(s.includes("://") ? s : `https://${s}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return ID.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && ID.test(v)) return v;
    // /embed/<id>, /shorts/<id>, /live/<id>
    const last = url.pathname.split("/").filter(Boolean).pop() ?? "";
    return ID.test(last) ? last : null;
  }
  return null;
}
