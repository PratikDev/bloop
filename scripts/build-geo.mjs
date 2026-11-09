// Builds the Turntable's geography overlays once into public/geo/ (simplified,
// rounded GeoJSON and compact JSON). Overlays and labels are for orientation
// only: no value or sound comes from them.
//
//   node scripts/build-geo.mjs
//
// Sources (licences and credits in docs/turntable.md):
//   Natural Earth v5.1.2 (public domain), pinned to one commit of nvkelso/natural-earth-vector
//   geoBoundaries gbOpen BGD ADM2 (CC BY 3.0 IGO; source BBS, OCHA ROAP)

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";

const OUT = fileURLToPath(new URL("../public/geo/", import.meta.url));
const NE_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const NE = (name) => `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_COMMIT}/geojson/${name}.geojson`;
const GB_BGD_ADM2 =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM2/geoBoundaries-BGD-ADM2_simplified.geojson";

/** South Asia, where the 10m detail is kept (lon/lat). */
const SOUTH_ASIA = "60,-5,105,40";
/** Rivers highlighted on the globe (Natural Earth names). */
const HIGHLIGHT_RIVERS = ["Ganges", "Padma", "Brahmaputra", "Jamuna", "Meghna"];
/** Populated places kept worldwide (Natural Earth scalerank; lower = more important); all of Bangladesh is kept. */
const MAX_PLACE_RANK = 7;

async function download(url) {
  console.log(`  ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

/** Runs mapshaper commands on one GeoJSON input and returns the parsed output. */
async function shape(input, commands) {
  const out = await mapshaper.applyCommands(`-i in.json ${commands} -o out.json format=geojson`, { "in.json": input });
  return JSON.parse(out["out.json"].toString());
}

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

async function write(name, data) {
  const text = JSON.stringify(data);
  await writeFile(`${OUT}${name}`, text);
  console.log(`wrote public/geo/${name} (${Math.round(text.length / 1024)} KB)`);
}

/** Inner label points ([lon, lat]) for each polygon, in feature order. */
async function labelPoints(input, idField) {
  const pts = await shape(input, `-points inner -filter-fields ${idField}`);
  return new Map(pts.features.map((f) => [f.properties[idField], f.geometry.coordinates.map((c) => round(c, 3))]));
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // Countries: whole world at 110m; South Asia at 10m for close-up.
  const world = await shape(
    await download(NE("ne_110m_admin_0_countries")),
    "-filter-fields NAME,NAME_EN,NAME_BN,LABEL_X,LABEL_Y,LABELRANK,ADM0_A3 -o precision=0.01",
  );
  await write("countries-110m.json", world);
  const southAsia = await shape(
    await download(NE("ne_10m_admin_0_countries")),
    `-clip bbox=${SOUTH_ASIA} -simplify 25% keep-shapes -filter-fields NAME,NAME_EN,NAME_BN,ADM0_A3 -o precision=0.001`,
  );
  await write("countries-10m-south-asia.json", southAsia);

  // Bangladesh districts, with label anchors.
  const districtsRaw = await download(GB_BGD_ADM2);
  const districts = await shape(districtsRaw, "-simplify 12% keep-shapes -filter-fields shapeName -o precision=0.001");
  const districtLabels = await labelPoints(districtsRaw, "shapeName");
  for (const f of districts.features) f.properties.label = districtLabels.get(f.properties.shapeName);
  await write("bd-districts.json", districts);

  // Rivers: world at 110m, South Asia at 10m; the GBM rivers flagged for highlighting.
  const riversWorld = await shape(await download(NE("ne_110m_rivers_lake_centerlines")), "-filter-fields name,name_bn,scalerank -o precision=0.01");
  // The 10m layer has no name_bn: borrow it from the 110m layer where the names match.
  const riversSA = await shape(
    await download(NE("ne_10m_rivers_lake_centerlines")),
    `-clip bbox=${SOUTH_ASIA} -filter 'featurecla === "River"' -simplify 40% -filter-fields name,scalerank -o precision=0.001`,
  );
  const bnByName = new Map(riversWorld.features.map((f) => [f.properties.name, f.properties.name_bn]));
  for (const f of riversSA.features) f.properties.name_bn = bnByName.get(f.properties.name) ?? null;
  const rivers = { type: "FeatureCollection", features: [...riversWorld.features, ...riversSA.features] };
  for (const f of rivers.features) f.properties.highlight = HIGHLIGHT_RIVERS.includes(f.properties.name);
  await write("rivers.json", rivers);

  // Seas and oceans (for "where am I" and labels), with label anchors.
  const marineRaw = await download(NE("ne_10m_geography_marine_polys"));
  const marine = await shape(marineRaw, "-simplify 8% keep-shapes -filter-fields name,name_bn,featurecla,scalerank -o precision=0.01");
  const marineLabels = await labelPoints(marineRaw, "name");
  for (const f of marine.features) f.properties.label = marineLabels.get(f.properties.name);
  await write("marine.json", marine);

  // Populated places as compact rows: [name, name_bn, lat, lon, pop_max, scalerank, country, capital].
  const places = JSON.parse(await download(NE("ne_10m_populated_places")));
  const rows = places.features
    .map((f) => f.properties)
    .filter((p) => p.SCALERANK <= MAX_PLACE_RANK || p.ADM0NAME === "Bangladesh")
    .map((p) => [p.NAME, p.NAME_BN ?? null, round(p.LATITUDE, 4), round(p.LONGITUDE, 4), p.POP_MAX, p.SCALERANK, p.ADM0NAME, /capital/i.test(p.FEATURECLA)]);
  await write("places.json", { fields: ["name", "name_bn", "lat", "lon", "pop_max", "scalerank", "country", "capital"], rows });

  await writeFile(
    `${OUT}SOURCES.json`,
    JSON.stringify(
      {
        generated_utc: new Date().toISOString(),
        note: "Orientation overlays only. No value or sound in the app comes from these files.",
        natural_earth: { version: "5.1.2", commit: NE_COMMIT, licence: "Public domain", credit: "Natural Earth" },
        geoboundaries: { url: GB_BGD_ADM2, licence: "CC BY 3.0 IGO", source: "Bangladesh Bureau of Statistics (BBS), OCHA ROAP", credit: "geoBoundaries" },
        tools: "mapshaper (simplify, clip, inner label points)",
      },
      null,
      2,
    ),
  );
}

await main();
