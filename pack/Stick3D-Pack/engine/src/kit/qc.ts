// QC MASK MODE: render with input props {"qcmask":true}. Stickman billboards are painted flat MAGENTA (body) + GREEN (face),
// fog-free, and captions/overlays are hidden, so tools/stickmask.py can measure his exact visibility, height and face position per frame.
import { getInputProps } from "remotion";
export const QC: boolean = (() => { try { return !!(getInputProps() as Record<string, unknown>).qcmask; } catch { return false; } })();
export const MASK_BODY = "#ff00ff", MASK_FACE = "#00ff00";
// paint an already drawn rig-v2 canvas as a key mask (silhouette magenta, face disc green)
export function maskify(c: CanvasRenderingContext2D, head: [number, number], headR: number, W: number, H: number) {
  c.save(); c.globalCompositeOperation = "source-in"; c.fillStyle = MASK_BODY; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "source-atop"; c.fillStyle = MASK_FACE; c.beginPath(); c.arc(head[0], head[1], headR * 0.92, 0, Math.PI * 2); c.fill(); c.restore();
}
export const CLEAN: boolean = (() => { try { return !!(getInputProps() as Record<string, unknown>).clean; } catch { return false; } })(); // {"clean":true}: no captions (thumbnails / clean plates)
