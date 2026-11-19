#!/usr/bin/env python3
"""actions.json -> sfx-events.json using rules/SFX_MAP.json (SFX tied to the actions).
actions.json = [{"t": 12.3, "action": "jump"}, {"t": 20.0, "action": "fx:explosion", "db": -2}, {"t": 30, "sfx": "riser"} ...]
usage: auto_sfx.py actions.json out_events.json"""
import sys, os, json
M = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rules", "SFX_MAP.json")))
ev = []
for a in json.load(open(sys.argv[1])):
    if "sfx" in a: ev.append({"t": a["t"], "sfx": a["sfx"], "db": a.get("db", -4)}); continue
    for off, s in M.get(a["action"], []): ev.append({"t": round(a["t"] + off, 3), "sfx": s, "db": a.get("db", -4)})
ev.sort(key=lambda e: e["t"]); json.dump(ev, open(sys.argv[2], "w")); print(f"{len(ev)} sfx events")
