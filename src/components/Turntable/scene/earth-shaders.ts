// The Earth's GLSL (surface, clouds and the data layer), used by createEarth (earth.ts).

export const SURFACE_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/** Shared GLSL: the sphere's east/north frame and the surface texture coordinates. */
export const SURFACE_COMMON = /* glsl */ `
uniform vec3 sunDir;       // object space
uniform float alwaysDay;
uniform float flipY;
varying vec2 vUv;
varying vec3 vPos;
vec2 surfaceUv() { return vec2(vUv.x, mix(vUv.y, 1.0 - vUv.y, flipY)); }
float daylight(float ndl) { return mix(smoothstep(-0.1, 0.14, ndl), 1.0, alwaysDay); }
`;

export const EARTH_FRAGMENT = /* glsl */ `
#define PI 3.141592653589793
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D normalMap;
uniform sampler2D cloudMap;
uniform sampler2D oceanMask;
uniform vec3 cameraLocal;
uniform float hasTextures;
uniform float cloudShadow;
uniform float sunIntensity;
uniform float nightGain;
uniform float normalStrength;
uniform float nightAmbient;
uniform vec3 fallbackColor;
uniform vec3 terminatorTint;
uniform vec3 oceanSheen;
${SURFACE_COMMON}

float ggx(float noh, float a) {
  float a2 = a * a;
  float d = noh * noh * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

void main() {
  vec3 n = normalize(vPos);
  vec2 uv = surfaceUv();
  vec3 east = vec3(n.z, 0.0, -n.x);
  float el = length(east);
  east = el > 1e-4 ? east / el : vec3(1.0, 0.0, 0.0);
  vec3 north = cross(n, east);

  vec3 t = texture2D(normalMap, uv).xyz * 2.0 - 1.0;
  t.xy *= normalStrength * hasTextures;
  vec3 N = normalize(t.x * east + t.y * north + max(t.z, 0.05) * n);

  float ocean = texture2D(oceanMask, vUv).r;
  vec3 day = mix(fallbackColor, texture2D(dayMap, uv).rgb, hasTextures);
  float ndl = dot(n, sunDir);
  float lit = daylight(ndl);

  // Cloud shadows: the cloud map seen from here toward the sun (clouds ≈ 6 km up, exaggerated).
  float slant = 0.006 / max(ndl, 0.2);
  vec2 toSun = vec2(dot(sunDir, east) / (2.0 * PI * max(el, 0.05)), dot(sunDir, north) / PI * (1.0 - 2.0 * flipY));
  float shadow = cloudShadow * texture2D(cloudMap, uv + toSun * slant).r * (1.0 - alwaysDay);

  float lambert = mix(max(dot(N, sunDir), 0.0), 1.0, alwaysDay);
  vec3 color = day * lambert * (1.0 - 0.6 * shadow) * sunIntensity;

  // A soft, slightly warm band along the terminator.
  float band = exp(-ndl * ndl / 0.012) * (1.0 - alwaysDay);
  color *= mix(vec3(1.0), terminatorTint, band * 0.55);

  // Ocean: GGX sun glint and a Fresnel sheen at grazing angles.
  vec3 v = normalize(cameraLocal - vPos);
  vec3 h = normalize(sunDir + v);
  float nov = max(dot(n, v), 1e-3);
  float nol = max(ndl, 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(v, h), 0.0), 5.0);
  float k = 0.09;
  float vis = 0.25 / ((nov * (1.0 - k) + k) * (nol * (1.0 - k) + k));
  float glint = ggx(max(dot(n, h), 0.0), 0.18) * vis * fresnel * nol;
  float grazing = pow(1.0 - nov, 4.0);
  color += ocean * (1.0 - alwaysDay) * (glint * sunIntensity * (1.0 - shadow) * vec3(1.0, 0.96, 0.88) + oceanSheen * grazing * nol * 0.35);

  // Night: city lights (HDR) and a faint earthshine surface.
  vec3 night = texture2D(nightMap, uv).rgb * hasTextures * nightGain + day * nightAmbient;
  gl_FragColor = vec4(mix(night, color, lit), 1.0);
  #include <colorspace_fragment>
}`;

export const CLOUD_FRAGMENT = /* glsl */ `
uniform sampler2D cloudMap;
uniform float opacity;
uniform float sunIntensity;
${SURFACE_COMMON}
void main() {
  vec3 n = normalize(vPos);
  float density = texture2D(cloudMap, surfaceUv()).r;
  float ndl = dot(n, sunDir);
  float light = mix(max(ndl, 0.0) * 0.95 + 0.03, 1.0, alwaysDay) * sunIntensity;
  gl_FragColor = vec4(vec3(light), smoothstep(0.08, 0.9, density) * opacity);
  #include <colorspace_fragment>
}`;

export const DATA_FRAGMENT = /* glsl */ `
uniform sampler2D dataMap;
uniform float opacity;
uniform float shade;
${SURFACE_COMMON}
void main() {
  vec4 texel = texture2D(dataMap, vUv);
  float ndl = dot(normalize(vPos), sunDir);
  // Lightness only (a scalar), so the colormap's hue is unchanged.
  float lightness = mix(1.0, mix(0.8, 1.0, daylight(ndl)), shade * (1.0 - alwaysDay));
  gl_FragColor = vec4(texel.rgb * lightness, texel.a * opacity);
  #include <colorspace_fragment>
}`;
