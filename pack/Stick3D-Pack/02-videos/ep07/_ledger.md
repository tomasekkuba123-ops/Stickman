# EP07 ledger — "What If Stickman's Baby Dragon Grew Up Overnight?"
- Voice: HeyGen 69.6 s -> voice_fit.py with pause markers (script_marked.txt) -> exactly 100.000 s, last word 97.4 s. Transcript recovered with pocketsphinx (JSGF candidate check); 3 uncertain lines flagged to the user.
- Sets: cottage + garden (morning), hallway with real doorway, night bedroom (teacup), town/mountains/sea flight (golden sunset), tropical island + eggs.
- QC (qc_check.py): PASS — 3000 frames; visible 97.2 %; big enough 76.5 %; 40-60 % band 59.9 %; no caption on face; head white 94.1 %; -14.1 LUFS / -1.2 dBTP.
- Iterations: QC FAIL x2 (size 57 % -> foreground-hero framing `fg()`; stickmask read grass as face -> exact key colours).
