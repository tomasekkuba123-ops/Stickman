# Úpravy textu kvůli souladu s obrázky

| Scéna | Původně | Nově | Důvod |
|---|---|---|---|
| 10 (02:24–02:40) | celá scéna (4 věty: „…across the toy room“ / „Stickman scrambled…“ / „The locomotive thundered…“ / „He jumped for the doorway…“) | The giant bedroom suddenly began folding around him. / Toy blocks blurred into the city lights outside. / The train was closing in, but the golden elevator waited ahead. / Stickman jumped for the doors, and the world flashed gold. | Text převzatý z OPRAVY_PRO_CLAUDE_KONTROLA.txt; vypráví přechod z pokoje na ulici. V obraze ho doplňuje „zlatý warp“ (1,6 s) na hranici 02:24: pokoj se zrychleně přiblíží do zlatého záblesku a z něj se vynoří ulice. |
| 22 (05:40) | It showed a distant lighthouse above floating islands. | It showed a shining castle above floating islands. | Na mapě v SCENE_22 není maják, ale zářící hrad. |
| 22 (05:44) | Beneath the lighthouse, forgotten objects filled an endless world. | Far below, a hidden world glowed with waterfalls and crystals. | Spodní část mapy ukazuje skrytý svět s vodopády a krystaly. |
| 27 (07:04) | Stickman turned the key, and the whole machine awakened. | Stickman pressed the key into the lock, and the machine awakened. | V SCENE_27 klíč vidět není, ruka je přiložená k zámku. |

Obrázek SCENE_03: šedé/hnědé boty přebarveny na červené tenisky (`tools/fix_scene03_shoes.py`, originál se uchová jako `images/SCENE_03_original.jpg`).

## Druhé kolo kontroly (OPRAVY_PRO_CLAUDE_KONTROLA.txt)

* **SCENE_05_NAVRH_OPRAVY.jpg:** porovnaný se scénami 04 a 06 a **nepoužitý**. Je kreslený v jiném stylu (2D komiks s černými obrysy), všech ostatních 29 scén je 3D render, takže by střih 04→05→06 působil jako vložený cizí obrázek. Původní SCENE_05 stylem navazuje a odpovídá i textu (vznášející se město, auta na obloze, výtah s portálem). Návrh je uložený v `proposals/` (do gitu nejde), kdyby ses rozhodl jinak.
* **SCENE_07:** při detailním srovnání se 06 sedí: červená mikina, batoh, černé kraťasy, tenké černé nohy, bílé rukavice, červenobílé tenisky, stejné proporce. Moje dřívější poznámka o „dlouhých kalhotách“ byla mylná. Ponechán originál.
* **Scény 09→10:** nový text scény 10 a vizuální přechod „gold warp“ se zvukovým efektem. Hlas Kokoro i titulky jsou přegenerované **jen pro scénu 10**, ostatní klipy zůstaly beze změny.
* **Scéna 27:** zachovaný opravený hlas i titulky („pressed the key into the lock“).
* **Scéna 11 / batoh:** beze změny, text ho nezmiňuje.
