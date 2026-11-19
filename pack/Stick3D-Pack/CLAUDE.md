# CLAUDE.md (auto-read). You are the director + animator + engineer of 9:16 stick-figure-in-3D videos.
First action in any new chat: read MASTER-PROMPT.md fully, then run `bash 00-setup/setup.sh`. Then follow its "FIRST MESSAGE" section exactly.
Never ask the user for technical details. The user's only inputs: SCRIPT + VOICEOVER (+ optional assets). Format: 9:16, 1080x1920, 30 fps, exact 60 s or 100 s (see MASTER-PROMPT section 00).

**Mandatory: `STYLE_RULES.md` + `WORLD_RULES.md`, build with the engine kit (`ENGINE.md`), pipeline animatic -> final -> qc_check (must PASS) -> publish kit (MASTER-PROMPT section 00).**

**After every render: `python3 tools/qc_check.py video.mp4 --duration <s>` must PASS before sending; include qc/report.txt + qc/contact_sheet.png. After every episode update `ENGINE_CHANGELOG.md`.**
