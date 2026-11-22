#!/usr/bin/env python3
"""MOTION LIBRARY: CMU BVH -> puppet joint angles (engine rig: Arm {a,b}, Leg {a,b,f}, lean, headTilt, root dx/dy).
usage: bvh_retarget.py clips.json out.json      clips.json = {"walk": {"file": "02_01.bvh", "from": 0.5, "to": 3.5}, ...}
Angles in degrees, 30 fps. side = sagittal plane (forward +), front = frontal plane (outward +). root in puppet units (hip height = 300)."""
import sys, json, re, numpy as np

def parse(path):
    txt = open(path).read(); hdr, mot = txt.split("MOTION"); toks = hdr.split()
    joints, stack, i = [], [], 0
    while i < len(toks):
        t = toks[i]
        if t in ("ROOT", "JOINT"): joints.append({"name": toks[i + 1], "parent": stack[-1] if stack else -1, "off": None, "ch": []}); i += 2; continue
        if t == "End": joints.append({"name": "end", "parent": stack[-1], "off": None, "ch": []}); i += 2; continue
        if t == "{": stack.append(len(joints) - 1)
        elif t == "}": stack.pop()
        elif t == "OFFSET": joints[stack[-1]]["off"] = np.array(list(map(float, toks[i + 1:i + 4]))); i += 4; continue
        elif t == "CHANNELS": n = int(toks[i + 1]); joints[stack[-1]]["ch"] = toks[i + 2:i + 2 + n]; i += 2 + n; continue
        i += 1
    lines = mot.strip().split("\n"); nf = int(lines[0].split()[1]); dt = float(lines[1].split()[2])
    data = np.array([list(map(float, l.split())) for l in lines[2:2 + nf]]); return joints, data, dt

def rotm(axis, deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    return {"X": np.array([[1, 0, 0], [0, c, -s], [0, s, c]]), "Y": np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]), "Z": np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])}[axis]

def fk(joints, row):
    pos, R, k = [None] * len(joints), [None] * len(joints), 0
    for j, J in enumerate(joints):
        loc, rot = J["off"].copy(), np.eye(3)
        for ch in J["ch"]:
            v = row[k]; k += 1
            if ch.endswith("position"): loc["XYZ".index(ch[0])] = v + (J["off"]["XYZ".index(ch[0])] if J["parent"] >= 0 else 0)
            else: rot = rot @ rotm(ch[0], v)
        if J["parent"] < 0: R[j] = rot; pos[j] = loc
        else: p = J["parent"]; R[j] = R[p] @ rot; pos[j] = pos[p] + R[p] @ loc
    return pos

def ang(v, fwd, up):  # angle of v from straight DOWN, + toward `fwd`, in plane (fwd, up)
    return float(np.degrees(np.arctan2(v @ fwd, -(v @ up))))

def retarget(path, t0, t1):
    joints, data, dt = parse(path); idx = {J["name"]: i for i, J in enumerate(joints)}
    up = np.array([0, 1.0, 0]); frames = []
    f0 = fk(joints, data[0]); hip_h = f0[idx["Hips"]][1] - min(f0[idx["LeftToeBase"]][1], f0[idx["RightToeBase"]][1]); k = 300 / max(hip_h, 1e-6)
    start = None
    t0 = max(t0, 0.12)  # frame 0 of the CMU BVH release is a rest/T-pose
    for t in np.arange(t0, min(t1, len(data) * dt - dt), 1 / 30):
        P = fk(joints, data[int(round(t / dt))]); g = lambda n: P[idx[n]]
        lat = g("RightUpLeg") - g("LeftUpLeg"); lat[1] = 0; lat /= np.linalg.norm(lat) + 1e-9   # toward the puppet's RIGHT
        fwd = np.cross(up, lat); fwd /= np.linalg.norm(fwd) + 1e-9
        if start is None: start = (g("Hips").copy(), fwd.copy(), lat.copy())
        fr = {}
        for view in ("side", "front"):
            o = {}
            for s, key in ((("Left", "L"), ("Right", "R")) if view == "side" else (("Right", "L"), ("Left", "R"))):  # front view faces the camera: actor's right = screen left (rig L)
                u = g(s + "ForeArm") - g(s + "Arm"); f = g(s + "Hand") - g(s + "ForeArm"); out = lat if s == "Right" else -lat
                th = g(s + "Leg") - g(s + "UpLeg"); sh = g(s + "Foot") - g(s + "Leg"); ft = g(s + "ToeBase") - g(s + "Foot")
                if view == "side":
                    a = ang(u, fwd, up); o["arm" + key] = [round(a), round(ang(f, fwd, up) - a)]
                    la = ang(th, fwd, up); o["leg" + key] = [round(la), round(la - ang(sh, fwd, up)), round(float(np.degrees(np.arctan2(ft @ up, ft @ fwd))) + 15)]  # +15: CMU rest foot pitch -> flat sole
                else:
                    a = ang(u, out, up); o["arm" + key] = [round(a), round(ang(f, out, up) - a)]
                    ln = np.linalg.norm(th) + np.linalg.norm(sh); reach = np.linalg.norm(g(s + "Foot") - g(s + "UpLeg"))
                    o["leg" + key] = [round(ang(g(s + "Foot") - g(s + "UpLeg"), out, up)), round(float((ln - reach) / ln * 300 * 1.2))]
            sp = g("Neck") - g("Hips"); hd = g("Head") - g("Neck")
            o["lean"] = round(-ang(-sp, fwd if view == "side" else lat, up)); o["head"] = round(-ang(-hd, fwd if view == "side" else lat, up) - o["lean"])
            fr[view] = o
        d = g("Hips") - start[0]; fr["root"] = [round(float(d @ start[1]) * k), round(float(d[1]) * k)]
        frames.append(fr)
    return frames

if __name__ == "__main__":
    clips = json.load(open(sys.argv[1])); lib = {}
    base = sys.argv[1].rsplit("/", 1)[0]
    for name, c in clips.items():
        lib[name] = {"src": "CMU " + c["file"].replace(".bvh", ""), "desc": c.get("desc", ""), "fps": 30, "loop": c.get("loop", False), "frames": retarget(f"{base}/bvh/{c['file']}", c["from"], c["to"])}
        print(name, len(lib[name]["frames"]), "frames")
    json.dump(lib, open(sys.argv[2], "w"), separators=(",", ":"))
