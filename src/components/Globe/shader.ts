// The globe is one full-screen triangle pair and this fragment shader: each
// pixel inside the disc is turned into a latitude and longitude on a sphere
// (orthographic view) and reads today's equirectangular EIC frame there.

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
uniform float u_time;    // seconds, for the signal rings
uniform vec2 u_target;   // where the rings start: latitude, longitude (radians)
uniform vec3 u_land;
uniform vec3 u_glow;
uniform vec3 u_ring;

const float PI = 3.14159265;
const float DISC = 0.86;  // the disc's radius, as a share of half the canvas (room for the halo)

float ring(float dist, float phase) {
  float radius = phase * 0.38;
  return smoothstep(0.014, 0.0, abs(dist - radius)) * (1.0 - phase);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / (0.5 * min(u_res.x, u_res.y) * DISC);
  float r2 = dot(p, p);
  if (r2 > 1.0) {
    // Fades to nothing before the canvas edge, so no square shows around the globe.
    float d = sqrt(r2) - 1.0;
    float halo = (1.0 - smoothstep(0.0, 0.14, d)) * exp(-d * 9.0) * 0.5;
    gl_FragColor = vec4(u_glow, halo);
    return;
  }
  vec3 n = vec3(p, sqrt(1.0 - r2));
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

  // Soft light from the upper left, and the atmosphere at the rim.
  vec3 light = normalize(vec3(-0.55, 0.45, 0.72));
  color *= 0.3 + 0.8 * clamp(dot(n, light), 0.0, 1.0);
  color = mix(color, u_glow, pow(1.0 - n.z, 3.0) * 0.5);

  // Signal rings spreading from the target, like the cursor on the map.
  float cosd = sin(lat) * sin(u_target.x) + cos(lat) * cos(u_target.x) * cos(lon - u_target.y);
  float dist = acos(clamp(cosd, -1.0, 1.0));
  float t = u_time * 0.32;
  float signal = ring(dist, fract(t)) + ring(dist, fract(t + 0.5)) + smoothstep(0.022, 0.008, dist);
  color = mix(color, u_ring, clamp(signal, 0.0, 1.0) * n.z);

  gl_FragColor = vec4(color, 1.0);
}`;
