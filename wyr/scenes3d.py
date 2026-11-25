"""3D option images for the WYR template, rendered with the Stickman engine (pack/Stick3D-Pack/engine, composition WyrScene,
source engine/src/videos/WyrScenes.tsx) in the series' toon-3D style. Each option = 2 layers (bg studio, fg hero) for parallax.
Results are cached in wyr/out/_scenes3d/<hash>_{bg,fg}.png; only missing images are rendered."""
import os, json, hashlib, subprocess, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "..", "pack", "Stick3D-Pack", "engine")
SRC = os.path.join(ENGINE, "src", "videos", "WyrScenes.tsx")
CACHE = os.path.join(HERE, "out", "_scenes3d")
SIZE = (1350, 1200)   # 1.25x the 1080x960 half -> room for push-in + parallax
SS = 1.5              # supersampling factor for the engine render


def item_key(it):
    src = hashlib.sha1(open(SRC, "rb").read()).hexdigest()[:10]
    return hashlib.sha1((json.dumps(it, sort_keys=True) + src).encode()).hexdigest()[:14]


def ensure(items):
    """items: [{name, side, ban, dark}] -> {index: (bg_path, fg_path)}; renders what is missing in ONE engine call"""
    os.makedirs(CACHE, exist_ok=True)
    out, todo = {}, []
    for i, it in enumerate(items):
        k = item_key(it); bg, fg = (os.path.join(CACHE, f"{k}_{l}.png") for l in ("bg", "fg"))
        out[i] = (bg, fg)
        if not (os.path.exists(bg) and os.path.exists(fg)):
            todo += [(dict(it, layer="bg"), bg), (dict(it, layer="fg"), fg)]
    if todo:
        with tempfile.TemporaryDirectory() as td:
            pj = os.path.join(td, "props.json"); json.dump({"items": [t[0] for t in todo]}, open(pj, "w"))
            gl = open(os.path.join(ENGINE, "..", ".gl-flag")).read().strip() if os.path.exists(os.path.join(ENGINE, "..", ".gl-flag")) else "swangle"
            print(f"rendering {len(todo)} 3D layers with the engine ...", flush=True)
            subprocess.run(["npx", "remotion", "render", "WyrScene", os.path.join(td, "seq"), "--sequence", "--image-format=png",
                            f"--frames=0-{len(todo) - 1}", f"--props={pj}", f"--gl={gl}", f"--scale={SS}", "--concurrency=4", "--log=error"],
                           cwd=ENGINE, check=True)
            files = sorted(os.listdir(os.path.join(td, "seq")))
            for (it, dst), fn in zip(todo, files):
                Image.open(os.path.join(td, "seq", fn)).convert("RGBA").resize(SIZE, Image.LANCZOS).save(dst)
    return out
