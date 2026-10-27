"use client";

import { useEffect, useRef } from "react";
import { readPalette } from "@/lib/css-tokens";
import type { GeoFiles } from "@/lib/geo/gazetteer";
import { toXY } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { Turntable } from "./use-turntable";

const WIDTH = 192;
const HEIGHT = 96;
const REDRAW_DEG = 0.25;

/** Natural Earth's countries drawn once, equirectangular, as the inset's background. */
function drawLand(ctx: CanvasRenderingContext2D, files: GeoFiles, land: string, sea: string) {
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = land;
  for (const f of files.countries110m.features) {
    if (!f.geometry) continue;
    const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const rings of polygons) {
      ctx.beginPath();
      for (const ring of rings) {
        ring.forEach(([lon, lat], i) => {
          const { x, y } = toXY({ lat, lon }, WIDTH, HEIGHT);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
      ctx.fill("evenodd");
    }
  }
}

/** A small world map with a dot where the needle is, for orientation. */
export function InsetMap({ tt, files, label, className }: { tt: Turntable; files: GeoFiles | null; label: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { subscribe, needle } = tt;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !files) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    const palette = readPalette();
    const background = document.createElement("canvas");
    background.width = canvas.width;
    background.height = canvas.height;
    const bctx = background.getContext("2d");
    if (!bctx) return;
    bctx.scale(dpr, dpr);
    drawLand(bctx, files, palette.haze, palette.night);
    let last = { lat: Infinity, lon: Infinity };

    const draw = () => {
      const at = needle();
      if (Math.abs(at.lat - last.lat) < REDRAW_DEG && Math.abs(at.lon - last.lon) < REDRAW_DEG) return;
      last = at;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(background, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { x, y } = toXY(at, WIDTH, HEIGHT);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = palette.shapla;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = palette.ink;
      ctx.stroke();
    };
    draw();
    return subscribe(draw);
  }, [files, subscribe, needle]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      style={{ width: WIDTH, height: HEIGHT }}
      className={cn("rounded-md border border-haze", className)}
    />
  );
}
