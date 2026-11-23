# What If Stickman Entered the Wrong Elevator? (8min vizuální střih)

Klasické horizontální YouTube video, 1920×1080, 16:9, 30 fps, H.264 MP4. Existují dvě verze: **s anglickým hlasem Kokoro** a **bez hlasu**.

## Hlas Kokoro

* Model Kokoro-82M v1.0 (licence Apache-2.0), běží přes `kokoro-onnx`, hlas `af_heart`, rychlost 1.0. Skript je `tools/make_voice_kokoro.py`.
* Model je potřeba stáhnout do `/root/kokoro/`: soubory `kokoro-v1.0.onnx` a `voices-v1.0.bin` z github.com/thewh1teagle/kokoro-onnx (release model-files-v1.0).
* Hlas se generuje po jednotlivých větách s pauzou 0,32 s. Díky tomu má každý titulek přesný čas začátku i konce věty (`subtitles/SUBTITLES_EN_KOKORO_SYNCED.srt`).
* Všech 30 klipů se vešlo do 16s slotu bez zrychlování: mají 11,1–13,9 s a rezervu aspoň 1,9 s (`timeline/KOKORO_VOICE_REPORT.csv`).
* Ověření přepisem řeči (Whisper base.en): shoda s textem průměrně 98,9 %. Jediné podezřelé místo je scéna 14 (3:32), kde přepis slyšel „Our glasses… Medair“ místo „Hourglasses… midair“, a je potřeba si ho poslechnout.
* Jiný hlas: `python3 tools/make_voice_kokoro.py --voice am_michael` (dál např. bm_george, am_fenrir), potom `python3 tools/add_voice.py --voices out/voice_kokoro --srt out/SUBTITLES_EN_SYNCED.srt`.
* Výsledný mix má -15,8 LUFS a true peak -1,2 dBFS. Efekty se pod hlasem automaticky ztiší (ducking).

## Výstupy (složka `out/`, do gitu se necommitují, viz `.gitignore`)

| Soubor | Co to je |
|---|---|
| `WHAT_IF_STICKMAN_WRONG_ELEVATOR_8min_KOKORO_VOICE.mp4` | Finální verze: obraz, hlas Kokoro, efekty a titulky vypálené podle skutečné řeči. |
| `WHAT_IF_STICKMAN_WRONG_ELEVATOR_8min_NO_VOICE.mp4` | Hotový vizuální střih: obraz, vypálené anglické titulky a decentní zvukové efekty. Bez hlasu. |
| `master_clean.mp4` | Stejný obraz **bez titulků a bez zvuku**. Používá ho `add_voice.py`, který z něj po dodání hlasu vyrobí finální verzi. |
| `SFX_STEM.wav` | Samostatná stopa zvukových efektů, 48 kHz stereo, přesně 480 s, kolem -31 LUFS. |
| `subs_burn.ass` | Titulky ve stylu pro vypálení do obrazu. |

V gitu jsou: `subtitles/SUBTITLES_EN.srt` (samostatné titulky pro YouTube), `timeline/` (časová osa), `tools/` (skripty) a `source_text/` (původní podklady).

## Časová osa

* Každý z 30 obrázků `SCENE_01.jpg` až `SCENE_30.jpg` má přesně 16,000 s: scéna N běží od (N−1)×16 s do N×16 s. Celkem 480,000 s = 14 400 snímků.
* Přechod je 0,6s prolínačka vycentrovaná na hranici scén, tj. 50 % prolnutí leží přesně na 00:16, 00:32… Video nemá černé ani šedé mezisnímky a první i poslední snímek jsou plně obrazové.
* Pohyb dělá jen kamera: Ken Burns zoom o 4 % (1,02→1,06), případně pomalý boční posun při zoomu 1,05, s plynulým náběhem a doběhem. Obrázek se zvětšuje pouze rovnoměrně, takže Stickman ani jeho červená mikina se nikdy nedeformují.
* Paralaxa: v popředí je jemná vrstva rozostřených světelných částic, která se pohybuje 2,5× rychleji než kamera. Skutečné rozdělení malby do hloubkových vrstev se nedělalo, protože by vyžadovalo vyřezávání a dokreslování postav a pozadí, a to by porušilo podmínku nedeformovat Stickmana.

## Vložení vlastního (lidského) hlasu místo Kokoro

1. Nahraj 30 klipů `VOICE_01.wav` až `VOICE_30.wav` (jde i mp3/m4a/flac). Jeden klip na scénu, text je ve `source_text/VOICEOVER_EN_TIMECODED.txt`.
2. Spusť:
   ```
   python3 tools/add_voice.py --voices cesta/ke/slozce_s_hlasem
   ```
3. Skript:
   * každý klip položí na začátek své scény (+0,15 s, lze změnit `--offset`),
   * **zastaví se s chybou**, když je klip delší než 16 s, aby nepřetekl do další scény,
   * přečasuje titulky podle skutečné řeči. Hledá pauzy mezi větami (ffmpeg silencedetect), a když je nenajde, rozdělí klip podle délky vět. Výsledek je `out/SUBTITLES_EN_SYNCED.srt`. Je to automatika, proto titulky ještě namátkově zkontroluj,
   * normalizuje hlas na -16 LUFS a efekty pod hlasem automaticky ztiší (ducking),
   * vytvoří `out/FINAL_with_voice.mp4` (s vypálenými titulky) a `out/FINAL_with_voice_nosubs.mp4` (pro nahrání SRT do YouTube jako CC).

Pro jiný střihový program jsou připravené soubory `timeline/SCENES.edl` (obraz), `timeline/VOICE_SLOTS.edl` (sloty hlasu) a `timeline/VOICE_SLOTS.csv`. CSV obsahuje čas vložení, maximální délku a minimální tempo řeči.

**Pozor na tempo:** texty scén mají 34–39 slov. Aby se vešly do 15,85 s, je potřeba mluvit aspoň 129–148 slov/min **bez pauz**. Pohodlné je zhruba 155–165 slov/min, při 160 slovech/min vychází 12,8–14,6 s na scénu.

## Kompletní přestavění

```
tools/build_all.sh      # ověří podklady → časová osa → SFX → titulky → render → kontrola
```
Potřeba: python3 + numpy, opencv-python-headless, scipy; ffmpeg s libass; font Inter. Obrázky patří do `images/`, zdroj je složka na Google Disku.

## Zvukové efekty

Všechny efekty (gong výtahu, svist portálu, vláček a píšťalka, bubliny, hluboké dunění chobotnice, tikání hodin, jiskry, vrzání kovu, otáčení stránek, třpyt) jsou **syntetizované přímo skriptem `tools/make_sfx.py`**. Nejsou použité žádné cizí nahrávky, takže nehrozí licence, vodoznaky ani poplatky. Seznam 105 efektů s časy a hlasitostí je v `timeline/SFX_CUES.csv`. Hudba v projektu není.

## Kontrola kontinuity obrázků (zjištěno při prohlídce všech 30 snímků)

Obrázky se do videa používají tak, jak jsou, nic se v nich nepřekresluje. Rozdíly níže je potřeba případně opravit ve zdrojových obrázcích:

* **SCENE_03:** Stickman má **tmavě šedé/hnědé boty** místo červených tenisek a nemá batoh. Oči jsou kreslené jinak (velké, obtažené).
* **SCENE_07:** spodní část působí spíš jako dlouhé černé kalhoty než jako kraťasy.
* **Batoh:** ve scénách 1, 2, 4 a 6–10 je batoh vidět, ve 03 a 05 vidět není a od scény 11 dál ho Stickman nemá.
* **SCENE_10:** text říká „across the toy room“, ale obrázek ukazuje noční ulici s obřími kostkami a vláčkem, ne dětský pokoj.
* **SCENE_05:** výtah má jiný design (kamenný rám s břečťanem, symbol ∞) než zlatý výtah ve scénách 2, 4, 6 a 8.
* **SCENE_22:** text zmiňuje maják nad létajícími ostrovy, na mapě v obrázku maják není (je tam podmořský hrad).
* **SCENE_27:** text „turned the key“, v obrázku klíč v ruce vidět není.
* **Scény 26–29:** svět ztracených věcí je zčásti „podmořský“ (medúzy, korály), ve 24–25 je nad mraky. Stylově to drží, jen pro informaci.
* Tvar obličeje (obočí, velikost očí) se mezi generacemi obrázků mírně liší, ale postava, červená mikina, bílé rukavice a červené tenisky drží (kromě scény 03).
