"""Simulační jádro: lokální model růstu kanálu What If Stickman.

Vše je fiktivní a běží jen v paměti / v lokálním JSON souboru.
Žádné síťové požadavky, žádné napojení na YouTube ani jiné služby.
"""
from __future__ import annotations

import json
import math
import random
from dataclasses import asdict, dataclass, field
from pathlib import Path

CHANNEL_NAME = "What If Stickman (SIMULACE)"
CURVES = ("linear", "accelerating", "logistic", "viral")


@dataclass
class Config:
    target_views: int = 100_000      # kolik zhlédnutí přidat celkem
    target_subs: int = 5_000         # kolik odběratelů přidat celkem
    views_per_hour: float = 1_500.0  # základní rychlost růstu zhlédnutí
    subs_per_hour: float = 60.0      # základní rychlost růstu odběrů
    curve: str = "linear"            # tvar růstu, viz CURVES
    accel_pct_per_day: float = 10.0  # pro "accelerating": +% rychlosti za den
    noise_pct: float = 15.0          # náhodný rozptyl každého kroku (±%)
    seed: int | None = None

    def validate(self) -> "Config":
        if self.curve not in CURVES:
            raise ValueError(f"curve musí být jedna z {CURVES}")
        for name in ("target_views", "target_subs", "views_per_hour", "subs_per_hour"):
            if getattr(self, name) < 0:
                raise ValueError(f"{name} nesmí být záporné")
        if not 0 <= self.noise_pct <= 100:
            raise ValueError("noise_pct musí být 0–100")
        return self


@dataclass
class Video:
    title: str
    weight: float           # podíl na nových zhlédnutích
    views: int = 0


def default_videos() -> list[Video]:
    titles = [f"What If…? EP{n:02d}" for n in range(1, 10)]
    # novější díly táhnou víc (jednoduchý model "čerstvosti")
    return [Video(t, weight=1.0 + i * 0.6) for i, t in enumerate(titles)]


@dataclass
class State:
    config: Config = field(default_factory=Config)
    hour: int = 0                    # simulovaný čas v hodinách
    start_views: int = 0
    start_subs: int = 0
    views: int = 0
    subs: int = 0
    videos: list[Video] = field(default_factory=default_videos)
    history: list[dict] = field(default_factory=list)  # [{hour, views, subs, dv, ds}]

    # ---------- odvozené statistiky ----------
    @property
    def gained_views(self) -> int:
        return self.views - self.start_views

    @property
    def gained_subs(self) -> int:
        return self.subs - self.start_subs

    @property
    def done(self) -> bool:
        c = self.config
        return self.gained_views >= c.target_views and self.gained_subs >= c.target_subs

    def stats(self) -> dict:
        c = self.config
        last24 = self.history[-24:]
        dv24 = sum(h["dv"] for h in last24)
        ds24 = sum(h["ds"] for h in last24)
        rem_v = max(0, c.target_views - self.gained_views)
        rem_s = max(0, c.target_subs - self.gained_subs)
        avg_v = dv24 / len(last24) if last24 else 0
        avg_s = ds24 / len(last24) if last24 else 0
        eta = max(rem_v / avg_v if avg_v and rem_v else 0,
                  rem_s / avg_s if avg_s and rem_s else 0)
        return {
            "channel": CHANNEL_NAME,
            "simulated_hours": self.hour,
            "simulated_days": round(self.hour / 24, 2),
            "views": self.views,
            "subs": self.subs,
            "gained_views": self.gained_views,
            "gained_subs": self.gained_subs,
            "progress_views_pct": _pct(self.gained_views, c.target_views),
            "progress_subs_pct": _pct(self.gained_subs, c.target_subs),
            "views_last_24h": dv24,
            "subs_last_24h": ds24,
            "subs_per_1000_views": round(1000 * self.gained_subs / self.gained_views, 2)
            if self.gained_views else 0.0,
            "eta_hours": None if self.done else (round(eta, 1) if eta else None),
            "done": self.done,
            "top_videos": sorted(
                ({"title": v.title, "views": v.views} for v in self.videos),
                key=lambda v: v["views"], reverse=True),
        }

    # ---------- perzistence ----------
    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "State":
        d = dict(d)
        d["config"] = Config(**d.get("config", {})).validate()
        d["videos"] = [Video(**v) for v in d.get("videos", [])] or default_videos()
        return cls(**d)

    def save(self, path: Path) -> None:
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.to_dict(), ensure_ascii=False, indent=1))
        tmp.replace(path)

    @classmethod
    def load(cls, path: Path) -> "State":
        if path.exists():
            return cls.from_dict(json.loads(path.read_text()))
        return cls()


def _pct(a: float, b: float) -> float:
    return 100.0 if b <= 0 else round(min(100.0, 100.0 * a / b), 2)


class Simulator:
    """Posouvá simulovaný čas po hodinách a navyšuje fiktivní čísla."""

    def __init__(self, state: State):
        self.state = state
        self.rng = random.Random(state.config.seed)

    def configure(self, **changes) -> None:
        """Změní nastavení. Nový cíl se počítá od aktuálních hodnot."""
        cfg = Config(**{**asdict(self.state.config), **changes}).validate()
        self.state.config = cfg
        self.state.start_views = self.state.views
        self.state.start_subs = self.state.subs
        if "seed" in changes:
            self.rng = random.Random(cfg.seed)

    def reset(self, views: int = 0, subs: int = 0) -> None:
        cfg = self.state.config
        self.state = State(config=cfg, views=views, subs=subs,
                           start_views=views, start_subs=subs)
        self.rng = random.Random(cfg.seed)

    def _multiplier(self) -> float:
        c, h = self.state.config, self.state.hour
        if c.curve == "linear":
            return 1.0
        if c.curve == "accelerating":
            return (1 + c.accel_pct_per_day / 100) ** (h / 24)
        if c.curve == "logistic":
            # S-křivka: pomalý start, vrchol kolem 3. dne, pak zpomalení
            x = (h - 72) / 18
            return 0.2 + 2.5 * math.exp(-x * x / 2)
        # viral: běžný provoz + občasný „virální“ výkyv
        return 8.0 if self.rng.random() < 0.03 else 1.0

    def _noisy(self, value: float) -> int:
        n = self.state.config.noise_pct / 100
        return max(0, round(value * (1 + self.rng.uniform(-n, n))))

    def step(self, hours: int = 1) -> State:
        s, c = self.state, self.state.config
        for _ in range(hours):
            if s.done:
                break
            m = self._multiplier()
            dv = min(self._noisy(c.views_per_hour * m), max(0, c.target_views - s.gained_views))
            ds = min(self._noisy(c.subs_per_hour * m), max(0, c.target_subs - s.gained_subs))
            self._spread_views(dv)
            s.views += dv
            s.subs += ds
            s.hour += 1
            s.history.append({"hour": s.hour, "views": s.views, "subs": s.subs, "dv": dv, "ds": ds})
            if len(s.history) > 24 * 120:          # max 120 dní historie
                del s.history[: len(s.history) - 24 * 120]
        return s

    def _spread_views(self, dv: int) -> None:
        vids = self.state.videos
        total_w = sum(v.weight for v in vids)
        left = dv
        for v in vids[:-1]:
            share = min(left, round(dv * v.weight / total_w))
            v.views += share
            left -= share
        vids[-1].views += left
