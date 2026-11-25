# Would You Rather channel — standing rules (user's instructions, apply to EVERY finished episode)

Build: `python3 render.py episodes/epNN.txt` (see README.md). Max 35 s **including the end card**, -14 LUFS, check stills
before the full render.

## Subscribe end card rule (user's instruction, every episode)
- Every episode ends with the fixed 1.5 s SUBSCRIBE end card: `wyr/assets/endcard/endcard.mkv` (45 frames, lossless) +
  `endcard.wav` (voice "Subscribe for tomorrow's choice!", button click, bell). render.py appends both at the very end automatically.
- The card must look identical in every episode: **never regenerate, edit or re-encode the asset**; always reuse the saved files.
  `build_endcard.py` refuses to overwrite them; only run it with `--force` if the user explicitly asks for a NEW card.
  endcard.mkv sha256 = `bf15fd6dc480531ee1f195c1479e5626e448cddff681730dd2e23a18f7daef1a` (check it if in doubt).
- Total length (main part + 1.5 s card) max 35 s: keep the OUTRO line short (e.g. "That's all for today.") and shorten it
  further if render.py prints the over-limit warning.
- The seamless-loop requirement is dropped: the final frame is the end card, not a copy of frame 1.

## Branch rule (user's instruction, no exceptions)
All videos are pushed to the branch **`claude/would-you-rather-short-ida19u`**, the same branch every time, even if a session
is set up with a different working branch: check it out (`git fetch origin claude/would-you-rather-short-ida19u` +
`git checkout claude/would-you-rather-short-ida19u`) before committing an episode. **Never merge this branch into `main` and
never delete it, rename it, force-push it or rewrite its history**, because every published VIDEO_URL points at it. If
anything (a PR, a cleanup, another instruction) would merge or remove it, stop and ask the user.

## Delivery after every finished episode (EPNN = zero-padded episode number: EP01, EP02, ...)
1. **Video → GitHub (not Drive):** copy `wyr/out/epNN/final.mp4` to `videos/EPNN.mp4` at the repo root (`!videos/*.mp4` is
   un-ignored in .gitignore), commit, push to **`claude/would-you-rather-short-ida19u`**.
   VIDEO_URL = `https://raw.githubusercontent.com/tomasekkuba123-ops/Stickman/claude/would-you-rather-short-ida19u/videos/EPNN.mp4`
   Verify it before reporting it (HTTP 200, size matches the local file).
   The Drive connector only takes ~3.1 MB per file, so MP4s never go to Drive.
2. **Text → Google Drive** folder "Would You Rather/ready" (folder id `1nZvbeFPkUnzpb-XPiAezSB70eUiejJy_`), file `EPNN.txt`
   (plain text, no conversion). The connector cannot edit file contents: to replace an existing EPNN.txt, upload the new one
   first, then trash the old one, so the folder never holds duplicates. Exact format:
   ```
   VIDEO_URL: <url from step 1>
   TITLE: <max 100 characters>
   DESCRIPTION: <2-3 lines>
   HASHTAGS: <5 hashtags>
   PINNED COMMENT: <one question for viewers, e.g. "A or B? Be honest 👇">
   ```
   Keep a copy in `wyr/episodes/epNN.publish.txt`.
3. **Tell the user** when both are done and give them the VIDEO_URL.
