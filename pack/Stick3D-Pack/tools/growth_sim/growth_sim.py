#!/usr/bin/env python3
"""Lokální simulátor růstu kanálu What If Stickman.

POUZE TESTOVACÍ PROSTŘEDÍ: čísla jsou fiktivní, ukládají se do lokálního
JSON souboru a nikdy se neposílají na YouTube ani jinam. Dashboard poslouchá
jen na 127.0.0.1.

Příklady:
  python3 growth_sim.py config --views 100000 --subs 5000 --views-per-hour 2000 --subs-per-hour 80 --curve accelerating
  python3 growth_sim.py run --hours 72
  python3 growth_sim.py stats
  python3 growth_sim.py serve            # dashboard na http://127.0.0.1:8765
  python3 growth_sim.py reset --views 1200 --subs 40
"""
from __future__ import annotations

import argparse
import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sim import CURVES, Simulator, State  # noqa: E402

HERE = Path(__file__).resolve().parent
DEFAULT_STATE = HERE / "sim_state.json"


# ---------------------------------------------------------------- CLI výpis
def fmt(n: float) -> str:
    return f"{n:,.0f}".replace(",", " ")


def print_stats(st: dict) -> None:
    eta = "hotovo" if st["done"] else (f"{st['eta_hours']} h" if st["eta_hours"] else "–")
    print(f"\n  {st['channel']}   (simulovaný čas: {st['simulated_hours']} h = {st['simulated_days']} dní)")
    print("  " + "─" * 60)
    print(f"  Zhlédnutí:   {fmt(st['views']):>14}   +{fmt(st['gained_views'])}  ({st['progress_views_pct']} % cíle)")
    print(f"  Odběratelé:  {fmt(st['subs']):>14}   +{fmt(st['gained_subs'])}  ({st['progress_subs_pct']} % cíle)")
    print(f"  Posl. 24 h:  +{fmt(st['views_last_24h'])} zhlédnutí, +{fmt(st['subs_last_24h'])} odběrů")
    print(f"  Odběrů na 1000 zhlédnutí: {st['subs_per_1000_views']}    Odhad do cíle: {eta}")
    print("  Videa:")
    for v in st["top_videos"]:
        print(f"    {v['title']:<22} {fmt(v['views']):>12}")
    print()


# ---------------------------------------------------------------- server
class Runner:
    """Drží simulátor a v pozadí ho posouvá zvolenou rychlostí přehrávání."""

    def __init__(self, path: Path):
        self.path = path
        self.sim = Simulator(State.load(path))
        self.lock = threading.Lock()
        self.running = False
        self.hours_per_sec = 6.0
        threading.Thread(target=self._loop, daemon=True).start()

    def _loop(self):
        acc, last_save = 0.0, time.time()
        while True:
            time.sleep(0.1)
            with self.lock:
                if self.running:
                    acc += self.hours_per_sec * 0.1
                    whole = int(acc)
                    if whole:
                        acc -= whole
                        self.sim.step(whole)
                        if self.sim.state.done:
                            self.running = False
                if time.time() - last_save > 2:
                    self.sim.state.save(self.path)
                    last_save = time.time()

    def snapshot(self) -> dict:
        with self.lock:
            s = self.sim.state
            return {"stats": s.stats(), "config": s.to_dict()["config"],
                    "history": s.history[-24 * 30:], "running": self.running,
                    "hours_per_sec": self.hours_per_sec}

    def command(self, body: dict) -> None:
        with self.lock:
            action = body.get("action")
            if action == "start":
                self.running = True
            elif action == "stop":
                self.running = False
            elif action == "step":
                self.sim.step(int(body.get("hours", 1)))
            elif action == "speed":
                self.hours_per_sec = max(0.1, min(500.0, float(body["hours_per_sec"])))
            elif action == "config":
                self.sim.configure(**_coerce_config(body["config"]))
            elif action == "reset":
                self.running = False
                self.sim.reset(int(body.get("views", 0)), int(body.get("subs", 0)))
            else:
                raise ValueError(f"neznámá akce: {action}")
            self.sim.state.save(self.path)


def _coerce_config(c: dict) -> dict:
    ints = {"target_views", "target_subs"}
    floats = {"views_per_hour", "subs_per_hour", "accel_pct_per_day", "noise_pct"}
    out = {}
    for k, v in c.items():
        if k in ints:
            out[k] = int(float(v))
        elif k in floats:
            out[k] = float(v)
        elif k == "curve":
            out[k] = str(v)
    return out


def make_handler(runner: Runner):
    page = (HERE / "dashboard.html").read_bytes()

    class H(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code, body: bytes, ctype="application/json"):
            self.send_response(code)
            self.send_header("Content-Type", ctype + "; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path in ("/", "/index.html"):
                self._send(200, page, "text/html")
            elif self.path == "/api/state":
                self._send(200, json.dumps(runner.snapshot()).encode())
            else:
                self._send(404, b'{"error":"not found"}')

        def do_POST(self):
            if self.path != "/api/cmd":
                return self._send(404, b'{"error":"not found"}')
            try:
                n = int(self.headers.get("Content-Length", 0))
                runner.command(json.loads(self.rfile.read(n) or b"{}"))
                self._send(200, json.dumps(runner.snapshot()).encode())
            except (ValueError, KeyError, TypeError) as e:
                self._send(400, json.dumps({"error": str(e)}).encode())

    return H


# ---------------------------------------------------------------- main
def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Lokální simulátor růstu kanálu (fiktivní data).")
    p.add_argument("--state", type=Path, default=DEFAULT_STATE, help="soubor se stavem simulace")
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("config", help="nastavit cíle a rychlost růstu")
    c.add_argument("--views", type=int, dest="target_views", help="kolik zhlédnutí přidat")
    c.add_argument("--subs", type=int, dest="target_subs", help="kolik odběratelů přidat")
    c.add_argument("--views-per-hour", type=float, dest="views_per_hour")
    c.add_argument("--subs-per-hour", type=float, dest="subs_per_hour")
    c.add_argument("--curve", choices=CURVES)
    c.add_argument("--accel", type=float, dest="accel_pct_per_day", help="%% zrychlení za den (accelerating)")
    c.add_argument("--noise", type=float, dest="noise_pct", help="náhodný rozptyl ±%%")
    c.add_argument("--seed", type=int)

    r = sub.add_parser("run", help="odsimulovat N hodin")
    r.add_argument("--hours", type=int, default=24)
    r.add_argument("--until-done", action="store_true", help="běžet až do splnění cílů (max 1 rok)")

    sub.add_parser("stats", help="vypsat přehled statistik")
    sub.add_parser("json", help="vypsat statistiky jako JSON")

    z = sub.add_parser("reset", help="začít znovu (nastavení zůstává)")
    z.add_argument("--views", type=int, default=0, help="počáteční zhlédnutí")
    z.add_argument("--subs", type=int, default=0, help="počáteční odběratelé")

    s = sub.add_parser("serve", help="spustit lokální dashboard")
    s.add_argument("--port", type=int, default=8765)

    a = p.parse_args(argv)
    sim = Simulator(State.load(a.state))

    if a.cmd == "config":
        keys = ("target_views", "target_subs", "views_per_hour", "subs_per_hour",
                "curve", "accel_pct_per_day", "noise_pct", "seed")
        sim.configure(**{k: getattr(a, k) for k in keys if getattr(a, k) is not None})
        sim.state.save(a.state)
        print(json.dumps(sim.state.to_dict()["config"], indent=2, ensure_ascii=False))
    elif a.cmd == "run":
        sim.step(24 * 365 if a.until_done else a.hours)
        sim.state.save(a.state)
        print_stats(sim.state.stats())
    elif a.cmd == "stats":
        print_stats(sim.state.stats())
    elif a.cmd == "json":
        print(json.dumps(sim.state.stats(), indent=2, ensure_ascii=False))
    elif a.cmd == "reset":
        sim.reset(a.views, a.subs)
        sim.state.save(a.state)
        print_stats(sim.state.stats())
    elif a.cmd == "serve":
        runner = Runner(a.state)
        srv = ThreadingHTTPServer(("127.0.0.1", a.port), make_handler(runner))
        print(f"Dashboard (jen lokálně): http://127.0.0.1:{a.port}   Ctrl+C = konec")
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            with runner.lock:
                runner.sim.state.save(a.state)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
