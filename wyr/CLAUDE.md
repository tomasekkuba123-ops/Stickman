# Would You Rather channel — standing rules (user's instructions, apply to EVERY finished episode)

Build: `python3 render.py episodes/epNN.txt` (see README.md). Max 35 s, -14 LUFS, check stills before the full render.

## Delivery after every finished episode (EPNN = zero-padded episode number: EP01, EP02, ...)
1. **Video → GitHub (not Drive):** copy `wyr/out/epNN/final.mp4` to `videos/EPNN.mp4` at the repo root (`!videos/*.mp4` is
   un-ignored in .gitignore), commit, push to the session's working branch.
   VIDEO_URL = `https://raw.githubusercontent.com/tomasekkuba123-ops/Stickman/<that branch>/videos/EPNN.mp4`
   Verify it before reporting it (HTTP 200, size matches the local file).
   The Drive connector only takes ~3.1 MB per file, so MP4s never go to Drive.
2. **Text → Google Drive** folder "Would You Rather/ready" (folder id `1nZvbeFPkUnzpb-XPiAezSB70eUiejJy_`), file `EPNN.txt`
   (plain text, no conversion; if it already exists, update it instead of creating a duplicate). Exact format:
   ```
   VIDEO_URL: <url from step 1>
   TITLE: <max 100 characters>
   DESCRIPTION: <2-3 lines>
   HASHTAGS: <5 hashtags>
   PINNED COMMENT: <one question for viewers, e.g. "A or B? Be honest 👇">
   ```
   Keep a copy in `wyr/episodes/epNN.publish.txt`.
3. **Tell the user** when both are done and give them the VIDEO_URL.
