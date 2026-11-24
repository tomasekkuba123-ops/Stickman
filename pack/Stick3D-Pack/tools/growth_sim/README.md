# Simulátor růstu kanálu (lokální testovací prostředí)

Fiktivní model růstu zhlédnutí a odběratelů kanálu **What If Stickman**.
Slouží k testování dashboardů, reportů a plánování cílů. Data jsou vymyšlená,
leží v `sim_state.json` a **nikdy se neposílají na YouTube** (žádné síťové volání,
dashboard poslouchá jen na `127.0.0.1`). Potřebuje jen Python 3.10+, nic dalšího.

## Rychlý start
```bash
cd pack/Stick3D-Pack/tools/growth_sim
python3 growth_sim.py serve                 # dashboard: http://127.0.0.1:8765
```

## CLI
```bash
# cíle + rychlost růstu
python3 growth_sim.py config --views 100000 --subs 5000 \
    --views-per-hour 2000 --subs-per-hour 80 --curve accelerating --accel 15 --noise 10
python3 growth_sim.py run --hours 72          # odsimulovat 3 dny
python3 growth_sim.py run --until-done        # až do splnění cílů
python3 growth_sim.py stats                   # přehled statistik
python3 growth_sim.py json                    # totéž jako JSON
python3 growth_sim.py reset --views 1200 --subs 40   # nový start s počátečními hodnotami
```

| Nastavení | Význam |
|---|---|
| `--views`, `--subs` | kolik zhlédnutí / odběratelů přidat (cíl se počítá od aktuálního stavu) |
| `--views-per-hour`, `--subs-per-hour` | základní rychlost růstu za simulovanou hodinu |
| `--curve` | `linear`, `accelerating` (+`--accel` % za den), `logistic` (S-křivka, vrchol ~3. den), `viral` (občasné 8× výkyvy) |
| `--noise` | náhodný rozptyl každé hodiny (±%) |
| `--seed` | pevný seed pro opakovatelné běhy |

Na dashboardu se navíc nastavuje rychlost přehrávání (simulované hodiny za sekundu).

## Statistiky
Celkové a získané hodnoty, % splnění cíle, přírůstek za posledních 24 h,
odběry na 1000 zhlédnutí, odhad času do cíle a zhlédnutí rozdělená podle videí
(novější díly dostávají větší podíl).

## Testy
```bash
python3 -m unittest test_sim.py
```
