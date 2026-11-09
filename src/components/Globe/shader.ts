// The globe is one full-screen triangle pair and this fragment shader: each
// pixel inside the disc is turned into a latitude and longitude on a sphere
// (orthographic view) and reads the equirectangular EIC frames there.

export const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_lon;     // longitude at the centre of the disc (radians)
uniform float u_lat;     // latitude at the centre of the disc (radians)
uniform float u_pulse;   // the ring's pulse, 0..1; below 0, none
uniform float u_outline; // the outline's width, as a share of the disc's radius
uniform float u_disc;    // the disc's radius, as a share of half the canvas
uniform vec2 u_target;   // where the ring sits: latitude, longitude (radians)
uniform vec3 u_land;
uniform vec3 u_edge;
uniform vec3 u_ring;

const float PI = 3.14159265;
const float RING_RADIUS = 0.06;
const float RING_WIDTH = 0.012;

float band(float dist, float radius) {
  return smoothstep(RING_WIDTH, 0.0, abs(dist - radius));
}

void main() {
  float half_size = 0.5 * min(u_res.x, u_res.y) * u_disc;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / half_size;
  float r = length(p);
  float px = 1.0 / half_size;
  if (r > 1.0) {
    // The hard outline: one pixel of antialiasing, nothing softer.
    gl_FragColor = vec4(u_edge, 1.0 - smoothstep(u_outline - px, u_outline, r - 1.0));
    return;
  }
  vec3 n = vec3(p, sqrt(1.0 - r * r));
  float c = cos(u_lat);
  float s = sin(u_lat);
  vec3 q = vec3(n.x, n.y * c + n.z * s, -n.y * s + n.z * c);
  float lat = asin(clamp(q.y, -1.0, 1.0));
  float lon = atan(q.x, q.z) + u_lon;
  vec2 uv = vec2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI);
  vec3 color = texture2D(u_tex, uv).rgb;

  // Land is flat grey in the frame: shown in the interface's land colour instead.
  float spread = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
  float land = step(spread, 0.035) * step(0.3, color.r) * step(color.r, 0.52);
  color = mix(color, u_land, land);

  // Soft light from the upper left.
  vec3 light = normalize(vec3(-0.55, 0.45, 0.72));
  color *= 0.3 + 0.8 * clamp(dot(n, light), 0.0, 1.0);

  // The target: a dot and a ring, and one spreading ring per beat (scale 1 to 1.6, fading).
  float cosd = sin(lat) * sin(u_target.x) + cos(lat) * cos(u_target.x) * cos(lon - u_target.y);
  float dist = acos(clamp(cosd, -1.0, 1.0));
  float signal = smoothstep(0.022, 0.008, dist) + band(dist, RING_RADIUS);
  if (u_pulse >= 0.0) signal += band(dist, RING_RADIUS * (1.0 + 0.6 * u_pulse)) * (1.0 - u_pulse);
  color = mix(color, u_ring, clamp(signal, 0.0, 1.0) * n.z);

  gl_FragColor = vec4(mix(color, u_edge, smoothstep(1.0 - px, 1.0, r)), 1.0);
}`;
