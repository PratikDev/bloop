# Official Challenge #14 resources as data

Every official SVS resource becomes a **record**: acquired by rule, decoded into values, checked against an independent NASA source, stored under the data contract and playable in the app with one plain voice and its provenance card. No creative layers in this pass.

## Layout

| Where | What |
|---|---|
| `pipeline/svs/` | the shared toolkit (below), run from `pipeline/` |
| `pipeline/svs/records/<name>/` | one package per resource: `acquire`, `decode`, `truth`, `validate`, `export`, `doc_text` |
| `pipeline/svs/cache/<id>.json` | the SVS API record, normalised (committed) |
| `data_raw/` | raw downloads and work files (git-ignored; capped at 20 GB; peak in `data_raw/_disk.json`) |
| `public/data/official/<record>/` | shipped record: `manifest.json`, `validation.json`, `checksums.tsv.gz`, `<layer>_<k>.u16.gz` (≤ 25 MB) |
| `public/data/official/index.json` | the app's record list |
| `public/mapping-official.json` | the records' voices (generated; merged into `mapping.json` at import) |
| `docs/official/<id>.md`, `<id>_assets.md` | per-resource report (generated) and asset inventory (generated) |
| `docs/official/VALIDATION_TABLE.md` | every check, every record (generated) |
| `docs/official/INVERSION_REGRESSION.md` | the gate that decides the default colour matcher |

## Toolkit (`pipeline/svs/`)

| Module | Does |
|---|---|
| `svs_api.py`, `choose.py` | API cache; frame-folder listings (old and new SVS formats); the asset rule and `<id>_assets.md` |
| `fetch.py`, `disk.py`, `acquire.py` | resumable, rate-limited downloads with a SHA-256 manifest; PNG prefixes; the disk cap |
| `frames.py` | PNG row-band decoding from a prefix; frame-time methods (date list, OCR, linear); ffmpeg extraction |
| `georef.py` | bounds, Natural Earth land IoU with a shift check, outline flood-fill for outline-only maps |
| `colorbar.py`, `ocr.py`, `colour.py` | strip, tick marks, glyph OCR (Tesseract when installed), linear/log/piecewise calibration |
| `invert.py`, `opacity.py` | colour → value: exact, chroma, hue (grey-floor renders) and opacity-ramp modes; residual = confidence |
| `flow.py`, `blobs.py`, `segment.py` | optical flow + streak axis; LoG events; hue classes with a confusion check |
| `export.py`, `validate.py`, `regrid.py` | the contract writer and size budget; shared statistics and the validation table; regridding |
| `ocr_dates.py`, `ocr_dates_check.py` | burned-in dates (month names, time zones) by the glyph OCR, and its 20-frame check |
| `cmr.py`, `places.py` | collection citations from CMR; geocoded named places (OSM, cached) |
| `eic.py`, `resources.py`, `watch.py`, `report.py` | the EIC inventory; the official list; the weekly watch; the final-report tables |
| `label_aerosols.py` | the 5669 hand-labelling page (`python -m svs.label_aerosols`) |

Extra libraries (librosa, imagecodecs) live outside the repo in `../tools/pylib` (see `docs/data-integration-plan.md` §14);
ffmpeg in `../tools/ffmpeg/`.

Tests: `python -m unittest discover -s svs/tests -t .` (from `pipeline/`).

## Running one record (from `pipeline/`)

```
python -m svs.records.<name>.acquire     # frames (resumable)
python -m svs.records.<name>.decode      # values, georef, stills; deletes the raw frames
python -m svs.records.<name>.truth       # validation sources (Earthdata Login / keys from .env.local)
python -m svs.records.<name>.validate    # validation.json + VALIDATION_TABLE.md
python -m svs.records.<name>.export      # public/data/official/<record>/ + index.json
python -m svs.records.voices             # public/mapping-official.json
python -m svs.records.doc <record>       # docs/official/<id>.md
python build_freshness.py --only=<record>
```

EIC class-A items: `python -m svs.records.eic.run <id> …`; class B: `python -m svs.records.eic.patterns`; live layers:
`python -m svs.records.live`. Completeness: `python -m unittest svs.tests.test_completeness`.
