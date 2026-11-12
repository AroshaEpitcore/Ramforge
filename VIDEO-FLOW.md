# FrameForge — Video Flow (A → Z)

How video works on FrameForge, end to end: the two kinds of video, how you add
each from the admin, what happens behind the scenes, how viewers watch, and how
to fix the things that commonly go wrong.

---

## 1. The two kinds of video

Every video on FrameForge is **one of two types**:

| Type        | Hosted on                         | Used for                                | How you add it                             |
| ----------- | --------------------------------- | --------------------------------------- | ------------------------------------------ |
| **YouTube** | YouTube (free embed)              | **Free** videos — zero hosting cost     | Paste a YouTube link in **Admin → Videos** |
| **Mux**     | Mux (your paid streaming account) | **Paid** lessons — secure, anti-sharing | Upload the file in **Admin → Uploads**     |

Which hosting the app uses for self‑hosted/paid video is controlled by the
`VIDEO_PROVIDER` environment variable:

- `mux` — Mux streaming (**current production setting**)
- `neon` — Neon Object Storage (progressive MP4 download/stream)
- `mock` — fake provider for local development (no real uploads)

> Free (YouTube) videos ignore `VIDEO_PROVIDER` entirely — they always embed from
> YouTube.

---

## 2. Adding a FREE video (YouTube)

1. Go to **Admin → Videos → New video**.
2. Set **Source = YouTube (free)**.
3. In **YouTube link or video id**, paste the video link — any of these work:
   - `https://youtu.be/dQw4w9WgXcQ`
   - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - `https://www.youtube.com/shorts/dQw4w9WgXcQ`
   - or just the id `dQw4w9WgXcQ`

   The app extracts the clean 11‑character id automatically.

4. Fill in title, category, description, etc. Set **Status = Published**.
5. Save. The video now plays on its page via a privacy‑friendly YouTube embed.

---

## 3. Adding a PAID video (Mux)

### Step by step

1. Go to **Admin → Uploads**.
2. Enter a **Title**, choose a **Category**, and pick a **video file** (MP4/MOV/WebM).
3. Click **Upload to Mux**. A progress bar runs, then it shows **"Processing on Mux…"**.
4. When Mux finishes, the video appears in **Admin → Videos** as a **paid DRAFT**.
5. Open it → set the **price**, optionally assign a **course / section**, add a
   description, then set **Status = Published**.
6. Done — it streams securely to buyers.

### What happens behind the scenes

```text
 You click "Upload to Mux"
        │
        ▼
 1. App creates a DRAFT Video row (gets an id)           saveVideo()
        │
        ▼
 2. App asks Mux for a direct‑upload URL                  /api/upload
        │
        ▼
 3. Browser uploads the file STRAIGHT to Mux (chunked)    UpChunk
        │                                                 (never through our server)
        ▼
 4. Mux encodes the video (basic quality, ≤1080p)
        │
        ▼
 5. Mux calls our webhook: "video.asset.ready"            /api/webhooks/mux
        │
        ▼
 6. We save Mux's signed PLAYBACK ID onto the Video       fullAssetId
    and mark it uploadStatus = READY
```

After step 6 the DRAFT is ready to price and publish.

---

## 4. How viewers watch

When someone opens a video, the player asks the server for a playback source:
**`/api/videos/[id]/playback`**. The server decides:

- **Free video** → no login needed.
  - YouTube source → returns the YouTube id (embed).
  - Mux source → returns a short‑lived **signed stream URL**.
- **Paid video** → requires **sign‑in** _and_ a matching **entitlement**
  (the viewer purchased this video, or a course that contains it). Then:
  - Enforces a **concurrent‑device limit** (anti‑sharing) via watch sessions.
  - Returns a short‑lived **signed Mux HLS URL** (a JWT token in the URL that
    expires, so links can't be shared).

The browser then plays it:

- **Mux (HLS `.m3u8`)** → played with **hls.js** in Chrome/Firefox/Edge, or
  native HLS on Safari/iOS.
- **YouTube** → privacy‑enhanced `youtube-nocookie` embed.

> **Security:** Mux videos use the `signed` playback policy. There is no public
> URL — every play needs a fresh token minted by our server with the Mux signing
> key. That's why the Mux dashboard says _"No public playback ID for previewing"_ —
> that's expected and correct.

---

## 5. Mux configuration (reference)

Set on the Vercel project (Production) — see `SETUP.md` §7.3 for the full walk‑through:

| Variable                                 | What it is                                                    |
| ---------------------------------------- | ------------------------------------------------------------- |
| `VIDEO_PROVIDER`                         | `mux`                                                         |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`      | API access token (Mux Video, Read + Write)                    |
| `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_KEY` | Signing key for secure playback (base64 private key)          |
| `MUX_WEBHOOK_SECRET`                     | Signing secret of the webhook pointing at `/api/webhooks/mux` |

The Mux webhook endpoint must be:
`https://<your-domain>/api/webhooks/mux`

**Cost note:** Mux is usage‑based with a free tier (≈100k streaming minutes/month
and up to 10 stored videos free). Encoding/storage/delivery are billed beyond
that. We cap uploads at _basic_ quality / 1080p to keep costs low.

---

## 6. Troubleshooting (things we actually hit)

| Symptom                                                                 | Cause                                               | Fix                                                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Uploads page shows **"Mux is not configured"** + a demo                 | `VIDEO_PROVIDER` isn't `mux` on the live deployment | Set `VIDEO_PROVIDER=mux` in Vercel **and redeploy** (env changes need a new deploy)                 |
| **"Could not create the video / fix the highlighted fields"** on upload | Draft was missing required fields                   | Fixed in code (sends `rentalDays`/`rentalPriceMajor`)                                               |
| Video page loads but the player is **blank / won't play**               | Chrome reports a false "maybe" for native HLS       | Fixed in code — the player now always uses **hls.js** for HLS (falls back to native only on Safari) |
| A change you made isn't showing                                         | Browser cached old code, or wrong URL               | **Hard refresh** (Ctrl+Shift+R); confirm you're on the correct site URL                             |
| Paid video returns 403                                                  | Viewer isn't signed in or hasn't purchased          | Expected — grant access (Admin → Access grants) or the viewer must buy it                           |
| Video stuck not `READY`                                                 | Mux webhook didn't reach us                         | Check the webhook URL + `MUX_WEBHOOK_SECRET` in Mux and Vercel                                      |

---

## 7. Where it lives in the code (map)

| Concern                                        | File                                                 |
| ---------------------------------------------- | ---------------------------------------------------- |
| Provider selector (`mux`/`neon`/`mock`)        | `src/lib/video/index.ts`                             |
| Mux provider (upload, signed playback, delete) | `src/lib/video/mux-provider.ts`                      |
| Neon storage provider                          | `src/lib/video/neon-provider.ts`                     |
| Admin uploads page                             | `src/app/admin/uploads/page.tsx`                     |
| Mux upload panel (UI + UpChunk)                | `src/features/admin/components/mux-upload-panel.tsx` |
| Videos editor (incl. YouTube link)             | `src/features/admin/components/video-manager.tsx`    |
| Save video action                              | `src/features/admin/actions.ts` (`saveVideo`)        |
| YouTube link → id helper                       | `src/lib/youtube.ts`                                 |
| Create‑upload endpoint                         | `src/app/api/upload/route.ts`                        |
| Mux webhook                                    | `src/app/api/webhooks/mux/route.ts`                  |
| Playback resolver (access + signed URL)        | `src/app/api/videos/[id]/playback/route.ts`          |
| Client player (resolves source)                | `src/features/videos/components/playback-player.tsx` |
| Video element (hls.js)                         | `src/components/shared/video-player.tsx`             |
| YouTube embed                                  | `src/components/shared/youtube-embed.tsx`            |

---

_Last updated: 2026-11-12._
