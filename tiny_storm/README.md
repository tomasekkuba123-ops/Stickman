# What If Stickman Drew a Tiny Storm? (40 s narration)

Hlas: **Kokoro-82M v1.0** (Apache-2.0, open-source TTS) přes `kokoro-onnx`, mužský americký hlas `am_michael`. Je to syntetický hlas (TTS), ne nahrávka člověka.

**Výstupy (`out/`):**
- `STICKMAN_TINY_STORM_VOICE_40S.wav`: 48 kHz, 16 bit, mono, přesně 40,000 s, -16,5 LUFS, true peak -1,5 dB. Bez hudby a efektů.
- `clips/SEG_01.wav` až `SEG_09.wav`: každý klip má přesně délku svého intervalu, takže se dají položit na 0, 4, 8, 12, 17, 22, 27, 32 a 36 s.
- `STICKMAN_TINY_STORM_VOICE_40S.srt`: titulky podle skutečné řeči.
- `timing.csv`: přesné časy každé fráze.

**Jak hlas vzniká:**
- Text se nemění. Generuje se po frázích, rozdělených jen na interpunkci. Mezi frázemi jsou dramatické pauzy 0,28–0,85 s a řeč začíná 0,12 s po začátku intervalu.
- Úsek 4 (12–17 s) je zrychlený na 1,12× a úsek 9 (36–40 s) na 1,07×, jinak by se do intervalu nevešly. Ostatní běží normálním tempem.
- Výslovnost: ve větě „One gust flipped it inside out!“ vyslovuje Kokoro standardně „it“ s měkkým „ɾ“, takže zní jako „her“. Proto se pro tuto frázi předávají fonémy s jasným „t“. Slova zůstávají stejná.
- Kontrola přepisem (Whisper): všech 9 úseků se shoduje s textem slovo od slova. Na hranicích intervalů je ticho, žádné slovo se neusekne.

**Jiný hlas:** `python3 tools/make_voice.py --voice am_fenrir` (případně `am_puck`, `am_eric`, `am_liam`). Model musí být v `/root/kokoro`, stejně jako u ep_elevator.
