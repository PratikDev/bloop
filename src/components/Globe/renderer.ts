import { hexToRgb, type Palette } from "@/lib/css-tokens";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

/** The frame is drawn at this size for the texture: smooth enough on a turning globe, light to upload. */
const TEXTURE_SIZE = { width: 1024, height: 512 };

export interface GlobeView {
  lon: number; // centre of the disc, radians
  lat: number;
  time: number; // seconds
}

export interface GlobeRenderer {
  draw(view: GlobeView): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

function toVec3(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Sets up WebGL for the globe; null if the browser can't (the caller shows the flat frame instead). */
export function createGlobeRenderer(canvas: HTMLCanvasElement, image: HTMLImageElement, palette: Palette, target: { lat: number; lon: number }): GlobeRenderer | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: true, alpha: true });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  // The frame, downscaled once by the browser (smoother than sampling the full 2048 px image).
  const scaled = document.createElement("canvas");
  scaled.width = TEXTURE_SIZE.width;
  scaled.height = TEXTURE_SIZE.height;
  scaled.getContext("2d")?.drawImage(image, 0, 0, scaled.width, scaled.height);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, scaled);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const at = (name: string) => gl.getUniformLocation(program, name);
  const u = { res: at("u_res"), lon: at("u_lon"), lat: at("u_lat"), time: at("u_time") };
  gl.uniform2f(at("u_target"), target.lat, target.lon);
  gl.uniform3f(at("u_land"), ...toVec3(palette.land));
  gl.uniform3f(at("u_glow"), ...toVec3(palette.haze));
  gl.uniform3f(at("u_ring"), ...toVec3(palette.shapla));

  return {
    draw({ lon, lat, time }) {
      gl.uniform1f(u.lon, lon);
      gl.uniform1f(u.lat, lat);
      gl.uniform1f(u.time, time);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    resize(width, height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.res, width, height);
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
