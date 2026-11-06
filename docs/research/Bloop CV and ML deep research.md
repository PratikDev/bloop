# Evidence reshapes Bloop's computer vision and ML plan

**Verdict: the idea index is deep as an engineering design but thin on evidence.** It does more than scratch the surface. §4 lists 15 computer-vision techniques plus two deeper "DP" versions, and §8 lists 14 ML ideas plus DP-ML1 and three GAP-AI tests. Almost every item has a named check, and the "DP principle" (every algorithm must extract something physical and be checked against a NASA source) is a stronger design rule than anything NASA's own sonification precedents use. But very little of that depth rests on published results. Where the index does cite sources, two citations turned out wrong or overstated. Several design rules had never been checked against the perception literature. And the plan missed files NASA already publishes that make some CV steps unnecessary. The research changed eight concrete things:

1. SVS already ships date files, separate data layers and standalone colorbar images for most official items, which removes OCR, segmentation and colorbar-cropping work.
2. On particle-trail renders, optical flow gets direction right but underestimates speed (the team's own synthetic test), so `flow.py` should report relative speed, not km/day, unless it is calibrated.
3. The colour-to-chord idea should stay tied to the colorbar, not to hue, and should be capped at about three simultaneous notes.
4. Three planned mappings clash with Bloop's own sound grammar: brightness → loudness, area → loudness and size → register.
5. Fourier "shape → timbre" has a noise-and-size confound.
6. Image-to-sound on NASA Earth imagery has prior art: "Aria" (Space Apps 2018 Global Nominee) and a 2024 satellite-cloud polyrhythm paper. Bloop's difference has to rest on value recovery, validation and locking sound to EIC frames.
7. The best-supported ML components verify the data rather than generate it.
8. "Generated in real time" needs a precise, measured wording.

None of this predicts judging. It is about what Bloop can defend.

## How to read the labels in this report

The evidence labels come straight from the research notes, and none has been upgraded:

- **[V]**: a researcher read the source and it says this.
- **[INF]**: an inference from [V] material.
- **[HYP]**: needs a Bloop test.

The researchers also ran their own **synthetic experiments** in this session. These used made-up fields, standard matplotlib colormaps and generated particle renders, not NASA frames:

- The colour and inversion experiments are labelled **[V-test]** (scripts `inv_test.py` and `inv_test2.py`).
- The frame and flow experiments are labelled **[EXP]** (scripts `vfrt_*.py`, all saved in the research notes folder).
- The shape experiment was labelled [V] in its notes because the researcher ran the code. It appears here as **[V, own synthetic run]**. Its script sat in a session scratchpad that may not persist, but its core code is reproduced in the notes.

All of these are sanity checks and upper bounds, not published results. Treat them as strong hints about real SVS frames, not proof. Index IDs (CV-x, ML-x, DP §x, DD §x, OR, GAP) refer to `BLOOP_IDEA_INDEX_post_statement.md`. The challenge text is quoted from the official statement (local copy at `/mnt/user-data/uploads/attachment.txt`).

The table below is the one-glance version of the term-by-term analysis that follows.

| Statement term (verbatim) | Index depth | What the research did |
|---|---|---|
| "computer vision to map color spectrums to musical chords" | Deep: CV-1 → histogram chord (DP §2.1) | **Supported** the colorbar-based chord over hue → chord; **added** a voice-count cap and per-record step size; **flagged** a grammar clash (area → loudness) |
| "analyze color palettes" | Moderate: CV-2 superseded, CV-9 hue segmentation | **Supported** the choice; **suggested** DBSCAN over k-means and per-item colour centroids |
| "translate pixel density into rhythm" / "spatial pixel density" | Deep: CV-3 → per-band polyrhythm (DP §2.4), CV-8 | **Defined** density three ways; **constrained** rhythm rates; **partly contradicted** comparing densities across simultaneous layers; **renamed** "flashes" |
| "brightness" | Moderate: DP §2.2 Stevens matching | **Corrected** exponent choice and grammar clash; night-light brightness is magnitude of change, not radiance |
| "visual shapes" / "geometric shapes" | Deep: CV-4 → Fourier timbre (DP §2.3), CV-6, ML-3 | **Found** a noise/size confound; **added** published tracker definitions, a wavetable option and a categorical-timbre option |
| "visual frames" / "extracting individual images (frames)" / "generated in real time" | Deep: CV-0, CV-5, ML-6, S-6 | **Removed** OCR for 3912; **measured** a Farnebäck speed bias; **specified** browser frame-lock and latency budgets; **drafted** honest wording |
| "machine learning algorithms" / "machine learning models" | Broad: ML-1…14, DP-ML1, GAP-AI1–3 | **Narrowed** to three candidates where ML verifies; **added** tracker calibration; **corrected** ML-2 |
| "custom computer vision algorithms" / "analyzes EIC visual frames" | Deep: CV-A, DP-CV1, CV-10, DD | **Benchmarked** colour spaces and degradation; **mapped** SVS assets; **found** Aria prior art and no NASA Earth-frame sonification method |

## "computer vision to map color spectrums to musical chords": the colorbar, not hue, should drive the chord

**What the index already plans.** CV-1 (a colorbar band becomes a chord under the melody) has been superseded by the **histogram chord** (DP §2.1, A3). The colorbar is split into equal perceptual colour steps (ΔE2000, a standard colour-difference formula), each step becomes a scale degree, and the steps visible on screen sound together, each as loud as the area it covers. It sits under the sound grammar (DP §1): pitch = how big, volume = confidence/coverage only.

**What the evidence supports.** Colour–sound links in human perception vary a lot in strength:

- **Pitch ↔ lightness is robust.** Sound–colour synaesthetes and controls alike map higher pitch to lighter colours, with no group difference [V] ([Ward et al. 2006](https://web-archive.southampton.ac.uk/cogprints.org/6268/1/Cortex_sound-colour_Synaesthesia.pdf)).
- **Pitch ↔ hue is weak** across individuals (pooled p = .058). The one rigid trend is that tones above 800 Hz are matched to yellow [V] ([Hamilton-Fletcher et al.](https://eprints.soton.ac.uk/439124/1/Hamilton_Fletcher_et_al._in_press_Sound_properties_associated_with_equiluminant_colours.pdf)).
- **Colour ↔ musical mode runs through emotion.** In US and Mexican samples, faster major-mode music matched lighter, more saturated, yellower colours, and music–colour and emotion ratings correlated at 0.89–0.99 [V] ([Palmer et al. 2013, PNAS](https://www.sciencedaily.com/releases/2013/05/130516151256.htm)).
- **Congruent mappings help learning.** On a colour-to-sound device, mappings that followed these links gave better memory and object recognition than reversed ones [V] ([Hamilton-Fletcher, Wright & Ward 2016](https://ouci.dntb.gov.ua/works/4VKbeZXl)).

The evaluated assistive systems map **colour to instrument, not colour to chord**. EyeMusic maps five colours to five instruments, and adding colour improved acuity from 20/800 to 20/400 in 13 blind and 10 blindfolded sighted users [V] ([Levy-Tzedek et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4227506)). The colour-to-chord systems found have little or no evaluation:

- Kritikos & Karpouzis map colour harmonies to chords with **no listener test** [V] ([arXiv 2101.12038](https://arxiv.org/pdf/2101.12038)).
- Polo & Sevillano's harmoniser reached about 70% image identification in a 12-person pilot [V] ([Springer](https://link.springer.com/10.1007/s12193-018-0280-4)).
- SYSTEM Sounds' Tycho piece mapped hue to pitch with no formal evaluation [V] ([Russo et al., ICAD 2022](https://icad2022.icad.org/wp-content/uploads/2022/06/9-Matt-ICAD2022_21.pdf)).

So the decision to supersede hue-based CV-1 with a colorbar-position chord is the better-supported reading of the statement's phrase [INF].

**What the evidence corrects.** The histogram chord has no direct precedent the researchers could find, and the perception limits are tight:

- **Listeners can't count many voices.** Counting voices in same-timbre polyphony drops sharply from 3 to 4, and the usual error is underestimation [V] ([Huron 1989](https://labs.sonicfield.org/library/voice-denumerability-in-polyphonic-music-of-homogeneous-timbres)).
- **Multi-stream displays manage about three streams.** Listeners monitor up to eight variables only when packed into three streams [V] ([Li & Walker, ICAD 2019](https://core.ac.uk/download/304995234.pdf)).
- **Equal steps produce too many notes.** The researchers measured each colormap's "perceptual path length" (summed ΔE2000 along the bar) [V-test]: cividis 87, viridis 121, turbo 225, jet 234, gist_rainbow 245. At 10 ΔE2000 per step that is **8–24 scale degrees**, far above what anyone can hear apart.

Rainbow bars would therefore always sound "busier" than viridis for the same data, which is an artefact of the colormap, not the planet [INF]. Two further problems:

- **Grammar clash:** area → loudness breaks the grammar rule "volume = confidence/coverage only" unless "area" is explicitly defined as coverage [INF].
- **Colour-space misuse:** ΔE2000 is meant for small colour differences ([Sharma et al.](https://hajim.rochester.edu/ece/sites/gsharma/papers/CIEDE2000CRNAFeb05.pdf)), so "equal ΔE2000 steps" should be built by adding up small increments along the curve, not measured between distant colours [INF].

**New options found.** All [HYP]:

- (a) Sound only the top three steps by area, with a spoken or haptic "+N more" cue.
- (b) Set the step size per record as path length ÷ 7, so every bar spans about one diatonic octave and records become comparable.
- (c) Ignore steps covering less than about 5% of the frame, following Kritikos's area threshold.
- (d) Add a short release cue when a step drops out, because Huron found voices entering are noticed more easily than voices leaving.

A separate risk appears on diverging and rainbow colorbars. Their brightest band is in the middle (white on RdBu, yellow/cyan on jet), so sighted viewers may expect the bright band to sound highest when Bloop's pitch follows the number. The legend should say "pitch follows the number, not the colour's brightness" [HYP].

**Cheapest tests.**

- **Chord count (1 hour, 5 listeners):** play histogram chords of 1–6 degrees from real SST frames and ask "how many notes?". If accuracy falls below about 70% beyond three, adopt the cap.
- **Legend sentence (5 people):** show a turbo frame, play two tones, ask "which point is hotter?", and compare errors with and without the legend sentence.

## "analyze color palettes": palettes describe categories; colorbars give values

**What the index already plans.** CV-2 (k-means dominant colours → mode of the background bed) is absorbed into the histogram chord. CV-9 / `segment.py` splits aerosol types by hue (DD §4), and night lights 5313 uses purple/orange classes.

**What the evidence supports.** The literature uses palette clustering only as a sub-step, never as a value source:

- Poco et al. cluster discrete legends with DBSCAN, a density-based clustering method that needs no fixed number of clusters, on colour plus position, because colours vary at edges [V] ([Poco, Mayhua & Heer 2018](https://pub-0ba4292bf23b48ceaee7d83b310f091c.r2.dev/files/papers/2018-ExtractingColorMappings-TVCG.pdf)).
- Yuan et al. found a palette-based baseline far worse on continuous colormaps (error 0.244 vs 0.015 on synthetic charts) [V] ([arXiv 2103.00741](https://ar5iv.labs.arxiv.org/html/2103.00741)).

The inference is that **k-means centroids are area-weighted averages that can fall off the colormap curve and carry no order**, so they must never become values [INF]. Palette methods belong only where colour is truly categorical: aerosol types, the night-lights classes, or frames without a colorbar, labelled "pattern only". Palmer's emotion finding also means any hue → major/minor rule imports mood rather than data, which reinforces the index's "no mood editorialising" rule. Keep mode fixed per record [INF].

**What the evidence corrects.** Two facts from SVS matter for CV-9 [V] ([SVS API 5572](https://svs.gsfc.nasa.gov/api/5572), [SVS API 5669](https://svs.gsfc.nasa.gov/api/5669)):

- Neither aerosol item ships per-type layers, so hue segmentation is still needed.
- The related Science On a Sphere page 5552 uses a different colour scheme (sea salt cyan, not blue).

So aerosol **class centroids must be set per item, not globally** [INF]. SVS 5572 also ships a separate transparent `Annotations/` layer, which can mask labels before segmentation [V/INF].

**New options found.** DBSCAN in colour-plus-position space is the better-evidenced alternative to k-means for CV-9 [INF]. The statement's "analyze color palettes" can be answered honestly by showing both: the area histogram along the colorbar (data) and, for frames without a colorbar, a categorical palette stated as "pattern only" [INF].

**Cheapest tests.**

- **Clustering comparison:** on the hand-labelled aerosol pixels already planned (DD §4), compare the k-means and DBSCAN confusion matrices.
- **EyeMusic-style probe (10 minutes, 3–5 people):** play an aerosol frame as four instruments vs as hue → pitch, and ask "which type dominates here?".

## "translate pixel density into rhythm" and "spatial pixel density": choose a definition, then respect hearing limits

**What the index already plans.** CV-3 (Euclidean rhythm, k = round(density × n) beats spread evenly) is superseded by **one Euclidean pattern per latitude band** on a shared bar (DP §2.4). CV-8 detects blobs with a Laplacian-of-Gaussian (LoG) filter for lightning (DD §6). Night lights get "density/intensity → tempo" (OR, A1), fires become Geiger clicks (GAP, OR §3.2), and the grammar says "rhythm = how many".

**What the evidence says about the definition.** The statement never defines "pixel density" [V]. The one definition with an official counterpart is NOAA's GLM **Flash Extent Density**: "the number of flashes that occur within a grid cell over a given period of time" [V] ([GLM Quick Guide](https://lightning.umd.edu/documents/glm/training/New2019/GLM_Quick_Guide_Gridded_Products_May_2019.pdf)). But one rendered dot is not necessarily one physical event:

- **Lightning has a three-level hierarchy.** LIS-type sensors record events (single bright pixels), groups (contiguous events in one 2-ms frame) and flashes (clusters of groups) [V] ([Peterson & Rudlosky 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6800735)), and SVS 5011 never says which level a dot is [V] ([SVS 5011](https://svs.gsfc.nasa.gov/5011/)).
- **A fire hotspot is a pixel, not a fire.** FIRMS says each hotspot is the centre of a 1 km (MODIS) or 375 m (VIIRS) pixel "containing one or more fires" [V] ([FIRMS FAQ](https://wiki.earthdata.nasa.gov/x/I52QD)).

The researchers proposed a three-way definition to state per record in `manifest.json` [INF]:

| Definition | Records | Note |
|---|---|---|
| Count density (blobs per cell per window) | 5011, fires | Has an official counterpart to check against |
| Coverage fraction | Night lights, aerosol masks, CO₂ plumes | Continuous fields with no discrete events |
| Local entropy | Any | A "busyness" texture measure, not an amount; belongs on a free dimension, not the rhythm channel |

**What the evidence corrects.**

- **Rename CV-8.** It should say "new LIS detections (dots)", not "new flashes", and the GHRC check should correlate against both group and flash counts and report which tracks better [INF]. SVS used ISS-LIS **V1** data, so the validation should name the GHRC version [V/INF].
- **Expect undercounts where lightning is densest.** Ten-day accumulated dots overlap and LoG merges them, so counts drop in exactly the busiest places. A two-regime estimator (blob count below some coverage c*, coverage-based above it) needs calibrating on synthetic renders [INF].
- **Choose the detector.** LoG is "the most accurate and slowest"; the faster DoG (difference of Gaussians) has the same bright-on-dark limit; DoH misses blobs under 3 px [V] ([scikit-image](https://scikit-image.org/docs/0.22.x/auto_examples/features_detection/plot_blob.html)). DoG for speed, with LoG as a check on a subsample, extends CV-8 [INF].
- **Fire clicks are per detection.** The fire voice must say "one click per detection", never "per fire" [INF].

**What hearing research allows.** Rate is a sensitive channel, but counting is not:

- **Tempo differences are easy to hear.** The smallest detectable tempo difference (just-noticeable difference, JND) falls to about 1.5% for regular sequences with 300–800 ms between onsets (the inter-onset interval, IOI). It is about 6% for a single interval [V] ([Drake & Botte 1993](https://link.springer.com/article/10.3758/BF03205262)).
- **There is a usable rate range.** People synchronise with sounds from about 0.56 to 8–10 events per second [V] ([Repp 2006](https://doaj.org/article/dc3f29b3977e4adf8dfe9aa998eb40de)).
- **Fast events are estimated, not counted.** At 3.5–8.5 events per second people estimate rather than count, with about 12% variability, and grouping by pitch or gaps improves precision [V] ([Anobile et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8255385)).
- **Blind listeners agree with "more = faster".** Blind listeners were "nearly unanimous" for positive tempo polarity [V] ([Walker & Mauney 2010](https://wirelessrerc.gatech.edu/sites/default/files/publications/walker_et_al_-_a_comparison_of_sonification_mappings.pdf)).

The resulting design band is 0.6–8 onsets per second per voice, with common densities in the 300–800 ms zone. With n = 16 steps, the bar must be **at least 2 seconds** long, or k must be capped [INF]. "One click per flash" should be presented as **rate**, not as countable events [INF].

**The polyrhythm idea is partly contradicted.** Euclidean rhythms are mathematically maximally even but have **no listening tests of their own** [V] ([Demaine et al. 2009](https://users.monash.edu/~davidwo/papers/Demaine-etal-Rhythm-CGTA.pdf)), though evenness does affect rhythm memory and liking [V] ([Milne & Herff 2020](https://researchers.westernsydney.edu.au/en/publications/the-perceptual-relevance-of-balance-evenness-and-entropy-in-music/)). The decisive finding is from a 2026 scoping review (abstract only): "polyrhythms are more often perceived as integrated patterns than segregated streams" [V] ([Nijhuis et al. 2026](https://jyx.jyu.fi/handle/123456789/112752)). If the latitude-band layers fuse, a listener hears one texture and cannot tell which band is denser. Comparing densities across simultaneous layers (DP §2.4) is therefore not supported. Keep it as the musical A-side texture and give the analysis path (B-side) a solo/step-through mode. Wide register gaps and distinct timbres may help streams separate ([van Noorden via Christiansen et al.](https://backend.orbit.dtu.dk/ws/files/9720415/prod21339663270831.Christiansen_et_al_2012_poma.pdf)) [HYP]. Rotating each band's pattern changes no data, so the Science ↔ Art dial can move it freely [INF].

**Prior art to credit.** Badilla Cerdas split GOES-16 images into an 8×8 grid that plays repeated-note patterns by cloud density, with **no listener evaluation** [V] ([arXiv 2408.11461](https://arxiv.org/html/2408.11461v1)). Bloop differs by tying density to a validated NASA count and by testing listeners [INF].

**Cheapest tests.**

- **Lit-pixel curve (30 minutes):** plot total lit pixels over 200 consecutive 5011 frames. Steps or drops reveal how dots are added and removed.
- **Saturation point (1 hour):** run `blob_log` on synthetic frames with N known dots to find c*.
- **Density steps (2 hours, 5 people):** ask "which is denser?" for Euclidean pairs differing by Δk = 1, 2 or 3.
- **Band attribution (2 hours, 5 people):** ask "which band changed?" for three bands, close vs wide register. If the wide/distinct condition is not clearly above chance (1/3), drop the comparison claim.

## "brightness": a perceptual scale exists, but the clash with the sound grammar must be resolved

**What the index already plans.** DP §2.2 matches brightness to loudness and vibration with Stevens exponents (brightness 0.33/0.5, loudness 0.67), only where brightness *is* the data (night lights, lightning, fire glow), labelled "perceptual matching" and tested with five people. Positive polarity is already built.

**What the evidence supports.** Brightness from video frames should be computed as relative luminance on linearised sRGB (0.2126 R + 0.7152 G + 0.0722 B) [V] ([W3C WCAG](https://www.w3.org/TR/WCAG2/relative-luminance.html)) and then converted to CIE L*. L* contains a cube root, numerically the same as Stevens' 0.33 brightness exponent, so **L* already is a perceived-brightness scale**. Applying Stevens on top of it would count the cube root twice [INF]. Brightness → loudness is also the convention in The vOICe, EyeMusic and Chandra pieces [V] ([Chandra handout](https://chandra.harvard.edu/sound/images/sound2.pdf)), so DP §2.2 is a calibrated refinement of a known convention, not a novelty [INF].

**What the evidence corrects.**

- **The exponent depends on the viewing condition.** Brightness is 0.33 for a 5° target in the dark, 0.5 for a point source or brief flash, and 1 for a point source briefly flashed [V] ([Stevens table, Wikipedia secondary](https://en.wikipedia.org/wiki/Stevens%27s_power_law)). Lightning and fire dots are flashing point sources, so DP §2.2 should pick the exponent per mark type [INF].
- **Matching holds only on average.** Brightness and loudness can share a ratio scale at group level, but multiplicativity (×2 then ×3 should equal ×6) failed in 17 of 40 tests [V] ([Ellermeier et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8460511)). Individual matching slopes differ, with classic regression effects [V] ([Naumann, TeaP 2024](https://coms.events/teap-2024-regensburg/data/abstracts/en/abstract_0020.html)). "Looks twice as bright ≈ sounds twice as loud" is a **population-average heuristic** [INF].
- **The planned test design won't work.** Five people's magnitude estimates mostly show noise, so the five-person test should use paired comparison with a staircase [INF].
- **Grammar clash.** Brightness → loudness breaks "volume = confidence/coverage only" on a pitched voice. The fix is loudness for brightness **only on unpitched voices** (lightning cracks, fire crackle), and brightness → pitch elsewhere, which Marks' pitch–brightness link supports [INF] ([Walker et al. 2015 citing Marks](https://link.springer.com/content/pdf/10.3758/s13414-015-0977-3.pdf)).
- **Night-light brightness is change, not radiance.** On SVS 5313 the page says only "more light depicted in purple and … less light depicted in orange", with no scaling or units [V] ([SVS 5313](https://svs.gsfc.nasa.gov/5313)). Pixel brightness there encodes **magnitude of change** [INF].
- **The SOS version may end in 2024.** SVS 5475 filenames say "2012-2024" while its titles say 2012–2023 [V] ([SVS API 5475](https://svs.gsfc.nasa.gov/api/5475)). This affects which year the DD sign test compares against.

A commonly quoted claim, that obtained brightness–loudness matches agree with a predicted exponent of about 0.5, stays **UNVERIFIED**, because the 1965 originals could not be opened.

**New options found.** If DP §2.2 is kept, a worked equal-sensation mapping is about +10 dB per tenfold luminance for exponent 0.33, +15 dB for 0.5 and +30 dB for 1. Browsers set amplitude, not sound pressure, so only ratios mean anything [INF]. Data-driven mappings from Black Marble radiance (nW·cm⁻²·sr⁻¹, about 500 m) will almost certainly need a log transform, which Bloop should label as its own choice [V/INF] ([LAADS Black Marble](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/science-domain/nighttime-lights/)).

**Cheapest tests.**

- **Is the night-lights visual log-like? (1–2 hours):** on one annual-average 5475 frame, regress L* of about 100 city pixels against log₁₀ and against linear VNP46A4 radiance, and report R² for both.
- **Brightness–loudness staircase (1.5 hours, 5 people):** a two-interval staircase at four brightness levels gives each person's matching slope. If slopes differ by more than about 2×, state "population average only".

## "visual shapes" and "geometric shapes": Fourier timbre works on clean outlines and misleads on noisy small ones

**What the index already plans.** CV-4 (regionprops descriptors such as area, perimeter, eccentricity and solidity) is superseded by DP §2.3, **"Shape becomes timbre"**:

- Normalised Fourier descriptors (FDs) of an outline become additive harmonics. FDs describe a closed outline as a sum of rotating circles; the strength of each harmonic says how "wobbly" the outline is at that scale.
- Size → register, and centroid motion → tempo.

Related items are CV-6 (connected components + Hungarian matching for tracking), CV-12 isolines, ML-3 (SAM segmentation) and OR §3.3 (plume elongation → glide, eddy vorticity → swirl).

**What the evidence supports.** FDs outperform curvature scale space in the MPEG-7 benchmark (abstract only) [V] ([Zhang & Lu 2003](https://link.springer.com/doi/10.1007/s00530-002-0075-y)), and higher-order Hu moments degrade with noise [V] ([CVonline](https://homepages.inf.ed.ac.uk/rbf/CVonline/LOCAL_COPIES/SHUTLER3/node15.html)). In the researchers' own run [V, own synthetic run], with four shapes at 20 random rotations and scales, the FD "spectral centroid" separated the shapes cleanly (circle 1.17, ellipse 1.44, ragged 2.17, star 2.38; separations 6–34 standard deviations). The rotation and scale invariance works.

The shape–sound correspondence behind "round = pure, ragged = bright" is well replicated:

- **Bouba/kiki crosses languages.** It held in 917 speakers of 25 languages [V] ([Ćwiek et al., news release](https://www.eurekalert.org/news-releases/935211)), and in the remote Himba [V] ([Bremner et al. 2013](https://research.gold.ac.uk/id/eprint/8977/)).
- **Timbre matches shape strongly.** Harsh timbres matched jagged shapes at up to 94% (triangle) against 33% chance. But attack envelope differed between the sound types, which confounds the result [V] ([Adeli et al. 2014](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00352/full)).

A secondary summary lists **Tamil speakers in India** as robust and four languages below 50%. It also reports the effect is **much smaller in congenitally blind people for touched shapes** [V, secondary] ([Wikipedia summary](https://en.wikipedia.org/wiki/Bouba/kiki_effect)). No Bangla data was found.

**What the evidence corrects.**

- **Noise confound.** In the same synthetic run [V, own synthetic run], a *noisy small circle* scored an FD centroid of **2.46, as "bright" as the star (2.38)**. Even a clean small circle came out brighter than a large one because of pixel steps. Small objects also get the high register under "size → register", so size and brightness become linked through an artefact, not physics [INF].
- **Fractal dimension is useless per object.** Box-count fractal dimension was 0.98–1.00 for all shapes [V, own synthetic run]. The well-known cloud value of about 1.35 is an ensemble relation across many objects [V] ([AMS Glossary](https://glossary.ametsoc.org/wiki/fractal/)).
- **Grammar problems.** Timbre is best for categorical data [V] ([Walker & Nees](https://sites.lafayette.edu/neesm/files/2011/10/WalkerNeesTheSonificationHandbook-chapter2.pdf)), but continuous brightness is neither pitch nor instrument. Pitch and spectral brightness also interact: pitch changes beyond an octave shift perceived brightness [V] ([McAdams 2015](https://www.mcgill.ca/mpcl/files/mpcl/mcadams_2015_oxfordhdbkmuspsychol.pdf); [Cousineau et al. 2014](https://www.frontiersin.org/journals/systems-neuroscience/articles/10.3389/fnsys.2013.00127/full)). And size → register double-books pitch, which the grammar reserves for "how big" values [INF].

**New options found.**

- **Fix the noise artefact** [HYP], by either:
  - capping harmonics by outline length in pixels;
  - smoothing the contour with a width fixed in kilometres; or
  - measuring brightness against the noise floor of a perfect circle of the same pixel size.
- **Pick a timbre option.** The team can choose between:
  - **(a) categorical timbre**: three classes (round / elongated / ragged) from solidity + aspect ratio + FD centroid, each a clearly different instrument family, following Brewster's "easily told apart" advice [V] ([Brewster et al. 1993](https://www.dcs.gla.ac.uk/~stephen/papers/CHI93.PDF)); or
  - **(b) a declared new grammar channel**, "timbre brightness = boundary roughness", with its own automated check.

  The three-class number is the researcher's suggestion, not a verified limit [INF].
- **Name the robust descriptors.** Solidity and aspect ratio are robust and physically meaningful, so they can become explicit channels in the descriptive text [INF].
- **A "strict" sibling mapping.** Web Audio's `PeriodicWave` takes Fourier coefficients directly, so the outline's own spectrum can be played as a single-cycle wavetable. That is the strict-translation end of the statement's "artistic rulesets … based on visual shapes" [HYP]. The researchers found no published FD → additive-synthesis sonification in the ICAD-indexed work they searched [V search]. That supports "we found no precedent in what we searched", not "first".
- **Borrow published tracker definitions for CV-6** instead of inventing rules [INF]:
  - storms: TAMS overlap linking with area/eccentricity classes [V] ([TAMS, GMD 2024](https://gmd.copernicus.org/articles/17/6035/2024/));
  - atmospheric rivers: Guan & Waliser's length > 2000 km and length/width > 2 [V] ([abstract](https://ui.adsabs.harvard.edu/abs/2015JGRD..12012514G));
  - multi-threshold core/envelope detection like tobac [V] ([tobac, GMD 2024](https://gmd.copernicus.org/articles/17/5309/2024/)).

  ARTMIP found "a large spread" in how often 14 algorithms detect atmospheric rivers [V] ([Shields et al. 2018](https://gmd.copernicus.org/articles/11/2455/2018/)), which gives an honest line for Bloop's text.
- **Gate the eddy "swirl" voice.** Okubo–Weiss (OW) eddy detection over-detected by about 70% even on real sea-level maps [V] ([Yi et al. 2014](https://os.copernicus.org/articles/10/39/2014/os-10-39-2014.pdf)). An eddy should become a swirl voice only if OW agrees with a closed contour in the recovered field [HYP].
- **Avoid py-eddy-tracker as a dependency.** It is GPL-3.0 [V], so cite it as method precedent only [INF].
- **Keep ML-3 (SAM) in backlog.** SAM-family models generalise to overhead imagery but fail systematically on some targets [V] ([Ren et al.](https://arxiv.org/abs/2304.13000v4)). On EIC frames, objects are value contours, so a threshold mask is more physical than a visual edge [INF].
- **Prefer touch tracing for exact outlines.** Passive vOICe-style scanning identified shapes at only 31% (6-way choice), against 66% for active touch scraping [V] ([van den Doel et al. 2004](https://core.ac.uk/download/19562786.pdf)). A "trace the outline" touch mode is the evidence-backed route to exact outlines; FD timbre conveys only overall quality [INF].

**Cheapest tests.**

- **Noise artefact on real masks (1 hour):** plot FD centroid vs pixel area for 50 real masks (5011 cells or 5669 plumes). A negative correlation means the artefact is present; re-run with km-fixed smoothing.
- **Shape matching (1 hour, 6–10 listeners):** a three-way match using additive tones with **identical envelopes**. If accuracy is near chance, add an attack/noise cue or choose option (a).
- **Wavetable listen (30 minutes):** render PeriodicWave versions of a circle and a star; the star should show a strong fifth harmonic.
- **SAM vs threshold (≤2 hours):** IoU of SAM 2 tiny vs threshold masks on five 5669 frames.

## "visual frames", "extracting individual images (frames)" and "generated in real time": NASA publishes the timing; Bloop must word the rest precisely

**What the index already plans.**

- CV-0 extracts frames with ffmpeg and plans an in-browser lock with `requestVideoFrameCallback`.
- `frames.py` gets time from the SVS date layer, then OCR, then linear interpolation.
- CV-5 / DP-OF / `flow.py` turn Farnebäck optical flow (an algorithm estimating per-pixel motion between two frames) into "speed in km/day", direction, vorticity and divergence, checked against OSCAR.
- ML-1 is RAFT as an ablation and ML-6 is OCR.
- S-6 has "three meanings of real time", and EV-6 targets under 50 ms.

**What the evidence supports.**

- **3912 needs no OCR.** SVS publishes `flat_ecco2_dates.txt`: **2000 lines, frames about 4 h 07–08 min apart** (about 0.172 day), from 25 Mar 2007 to 3 Mar 2008 [V] ([dates file](https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/flat_ecco2_dates.txt)). It belongs to the hyperwall frames, so whether it maps 1:1 to the 2048-px MP4 is [HYP].
- **5425 ships its timing and masks.** SVS 5425 publishes separate temperature, salinity, land-mask and **datesOnly** layers, and states particle **trail lengths of 3 days (above 600 m) and 6 days (below)** [V] ([SVS API 5425](https://svs.gsfc.nasa.gov/api/5425)).
- **ffmpeg extraction is exact.** In the researchers' test [EXP], `-fps_mode passthrough -frame_pts 1` gave exactly 300 frames from a 10-s clip, and selecting frame 137 gave a pixel-identical image.
- **The browser frame key is `mediaTime`.** It is the frame's presentation timestamp (PTS), and "what you should use if you want to exactly identify frames" [V] ([web.dev](https://web.dev/articles/requestvideoframecallback-rvfc)). But callbacks are best-effort, can be one refresh late, and may skip frames under load [V] ([WICG spec](https://wicg.github.io/video-rvfc)). iOS has a reported floating-point inaccuracy [V] ([WebKit bug 260798](https://lists.webkit.org/pipermail/webkit-unassigned/2023-August/1119080.html)).

**What the evidence corrects: optical-flow speed.** Optical flow on line-like structures is "ill-posed": only the motion component across a streak is measurable. This is the aperture problem [V] ([Heitz, Mémin & Schnörr 2009](https://ipa.iwr.uni-heidelberg.de/ipabib/Papers/EiF-10.pdf)). The researchers' synthetic test [EXP] advected 20,000 particles through a known flow and rendered fading trails:

| Rendering | Speed ratio (1.0 = right) | Angle error |
|---|---|---|
| Dots only | 0.99–1.00 | 1.9–4.7° |
| Short trails | 0.62–0.92 | 1.2–5.0° |
| Long trails | **0.35–0.61** | 1.6–2.6° |
| Saturated long trails | 0.00 | about 90° (total failure) |

So **direction is trustworthy but speed is not** [INF]. That supports the planned OSCAR direction check (≤ 45°) and contradicts reporting `flow.py` speed in km/day without calibration. There is also a scale problem: a 1 m/s current would move only about 0.76 px per frame at 2048 px, and SVS never says the animators advected at true model speed [INF]. Fit one scale factor per record against OSCAR and report it. If it is far from 1, say "the visualization's motion is stylised; Bloop reports relative speed" [INF].

For **5425**, an OSCAR *speed* check compares different quantities: particles follow the 3-D field, the view is a camera close-up, and OSCAR averages the top 30 m [V] ([PO.DAAC OSCAR](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_FINAL_V2.0)). That contradicts DD §5's "speed vs OSCAR" for 5425; keep direction as "pattern agreement" [INF]. A new option is **streak-length velocimetry**: visible trail length ÷ 3 days gives speed with no frame spacing needed [HYP].

**Learned flow and OCR.**

- **Leaderboards don't transfer to these images.** Models that top Sintel/KITTI "do not necessarily translate" to particle-image velocimetry, and the main PIV benchmark omits Farnebäck [V] ([MCFormer, arXiv 2507.04750](https://arxiv.org/pdf/2507.04750v2)). SEA-RAFT runs at about 50 ms per pair on an RTX 3090 and is BSD-3 [V] ([arXiv 2405.14793](https://arxiv.org/pdf/2405.14793); [oosmetrics](https://oosmetrics.com/repo/princeton-vl/SEA-RAFT)), while Farnebäck took **585 ms per pair at 2048×1024** on one CPU core [EXP]. ML-1 is a valid offline ablation scored on Bloop's own truth, not a dependency [INF].
- **OCR needs reasonably large text.** Tesseract read synthetic dates 34/40 at 14 px text height but 18/40 at 10 px [EXP]. The researchers' order of preference for time is: official date file → OCR of the clean datesOnly layer → OCR of the composite → linear interpolation. A robust line fit (Theil–Sen) through all OCR reads exploits the fact that dates rise steadily [INF].

**"Real time" and latency.** Hermann's formal definition of sonification does not require real time; it requires that the same data and interactions give "structurally identical" sound [V] ([Hermann 2008](https://sonification.de/?p=39)). Interactive sonification uses "real-time" to mean a tight user–sound control loop [V] ([Hermann & Hunt 2004](https://interactive-sonification.org/files/HermannHunt2004-TDO.pdf)). The latency thresholds that matter:

- About 10 ms for playing an instrument [V] ([Wessel & Wright](https://arxiv.org/pdf/2010.01570)).
- About 100 ms to feel "instantaneous" [V] ([Nielsen](https://www.nngroup.com/articles/response-times-3-important-limits/)).
- For sound locked to video, 45 ms audio lead or 125 ms lag is detectable [V, secondary] ([Wikipedia on ITU-R BT.1359](https://en.wikipedia.org/wiki/Audio-to-video_synchronization)).
- Measured browser round-trip latency on desktops ranged from **38.9 to 104.7 ms**, with no phone data [V] ([Gil Panal et al., WAC 2025](https://gh.r-mj.com/gilpanal/weblatencytest)).

Live dense optical flow on phones is not realistic: native Farnebäck takes 156 ms per pair even at 1024×512 [EXP/INF]. Nobody found published per-frame timings for OpenCV.js or ONNX Runtime Web on budget phones.

**New options found.**

- **Compute the frame index from `mediaTime`:** `Math.round((mediaTime − firstPts) × fps)`, with `firstPts` stored in the manifest. When `presentedFrames` jumps, interpolate across the gap [INF].
- **Schedule audio to the displayed frame:** time each audio change to `expectedDisplayTime` via `AudioContext.getOutputTimestamp()`, so audio never leads the picture (method [UNVERIFIED this session]).
- **Add a cheap live check:** a 128×64 canvas LUT probe re-reads the colour on screen and compares it with the stored grid. Cross-origin video blocks pixel reads, so the MP4 must be self-hosted [INF].
- **Smooth offline, not live:** zero-phase smoothing of precomputed series, hysteresis on threshold bells, and audio-rate parameter ramps. Never smooth event channels [INF]. The 1€ filter is the standard *causal* tool, for live inputs such as pointer position [V] ([Casiez et al. 2012](https://cristal.univ-lille.fr/~casiez/1euro)).
- **Honest wording.** "Sound synthesised live from data; parameters locked to the displayed frame (measured skip rate x%); input-to-sound latency x ms on device y; computer vision runs offline so every number is checked first." Any blank that cannot be filled from a measurement must not be claimed [INF].

**Cheapest tests.**

- **Frame count (minutes):** `ffprobe -count_frames` on the 3912 MP4. If it is 2000, the date file maps 1:1.
- **Flow on 3912 (2 hours):** run `flow.py` over the Gulf Stream and Kuroshio for OSCAR angle and speed ratio, using frame pairs (k, k+2) and (k, k+4).
- **Browser skip rate (1 hour):** an rVFC page on a frame-numbered test MP4 on Chrome Android and iOS Safari.
- **Date OCR (30 minutes):** OCR 50 5425 datesOnly frames, fit Theil–Sen, and compare with SVS's stated 15 Jan 2021 – 25 Dec 2023.
- **Latency (1 hour):** host `weblatencytest` (MIT) on the demo laptop and two phones.
- **Smoothing (1 hour):** render raw vs causal vs zero-phase WAVs and count reversals per second.

## "machine learning algorithms" and "machine learning models": ML earns a place only where it verifies

**What the statement says.** ML is one of three allowed methods ("machine learning algorithms, open-source audio synthesis frameworks, or custom data-driven artistic rulesets"), and "the exact method of translation is entirely up to you" [V, statement]. The statement neither requires ML nor ranks it above rulesets. So ML earns a place only where an **ablation** (a comparison with and without the ML part) shows a measured gain in fidelity, accessibility or musicality [INF].

**What the index already plans.** §8 lists ML-1 to ML-14, DP-ML1 (learned inversion), GAP-AI1 (measure AI music against the data), GAP-AI2 (VLM accuracy on NASA maps) and GAP-AI3 (answers only from data), under the rule that "ML never generates the data sound, writes numbers, or runs unchecked."

**What the evidence supports.**

- **Learned mappings have precedent, but no accuracy evaluations.** Hermann's relevance-based optimisation (ICAD 2007) steered mappings by listener feedback [V] ([Bunte publication page](https://www.cs.rug.nl/~kbunte/publication/hermann2007/)). A 2021 smart-city system used a VAE to generate musical content with **no formal evaluation** [V] ([Roddy & Bridges](https://edepositireland.ie/handle/2262/98051)).
- **DDSP locks pitch by construction.** f0, the fundamental frequency, "is fed directly to the additive synthesizer". Supervised resynthesis error was 0.02 semitones (about 2 cents), and a "tiny" model has 0.24M parameters [V] ([Engel et al. 2020](https://ar5iv.labs.arxiv.org/html/2001.04643)). That backs ML-7.
- **DDSP-VST avoids pitch tracking.** Its MIDI mode builds pitch contours directly from MIDI [V] ([Magenta blog](https://magenta.tensorflow.org/ddsp-vst-blog)).
- **RAVE has no f0 control**, so it cannot guarantee data pitch [V] ([Caillon & Esling](https://ar5iv.labs.arxiv.org/html/2111.05011)). Don't use it for data voices [INF].
- **Text/image-to-music models don't carry numbers.** MusicGen's code is MIT but its **weights are CC-BY-NC 4.0** [V] ([model card](https://facebookresearch.github.io/audiocraft/model_cards/MUSICGEN_MODEL_CARD.html)). Its melody conditioning passes through an argmax-chroma "information bottleneck" [V] ([Copet et al. 2023](https://ar5iv.labs.arxiv.org/html/2306.05284)). Published image-to-music systems evaluate semantic or emotional fit with **no numeric or structural correspondence metric** [V] ([arXiv 2509.22378](https://arxiv.org/pdf/2509.22378); [arXiv 2602.17599](https://arxiv.org/html/2602.17599v1)). GAP-AI1 fills a real measurement gap [INF].
- **VLMs misread maps often.** On map value retrieval, humans scored 96.91% and multimodal LLMs 46.88% (best 59.10%) [V] ([MapIQ, arXiv 2507.11625](https://arxiv.org/html/2507.11625v2)). On CharXiv reasoning, GPT-4o scored 47.1% vs humans 80.5% [V] ([arXiv 2406.18521](https://arxiv.org/pdf/2406.18521)). In chart extraction, printed data labels cut Gemini 2.5 Flash's error from about 7% to 1.3–1.8% [V] ([ExChart-Bench, arXiv 2606.29808](https://arxiv.org/pdf/2606.29808v1)).
- **No benchmark covers Bloop's frame type.** The researchers found none targeting **continuous colormapped Earth-science maps with a colorbar** [INF from searches]. GAP-AI2 can contribute exactly that.

**What the evidence corrects.**

- **ML-2 misdescribes its source.** arXiv 2507.20632 is not "k-means + monotonic path". It is a trained U-Net/MLP encoder–decoder that outputs a 10-point B-spline colormap and is fine-tuned per image. It assumes a linear mapping, reports only colormap error, never value error, and states no code licence [V] ([arXiv 2507.20632](https://arxiv.org/html/2507.20632v2)). Its own direction-aware real-world result (0.071) is marginally worse than the baseline's (0.070) [V]. Most EIC frames ship colorbars, so ML-2 adds little [INF].
- **ML-8 needs a calibration step.** At 10-cent tolerance on synthetic tones, CREPE scored 0.995 vs pYIN 0.908 [V] ([Kim et al. 2018](https://arxiv.org/pdf/1802.06182)). Mean errors were penn 12.72 cents, CREPE 21.07 and pYIN 110.5 [V] ([arXiv 2301.12258](https://arxiv.org/pdf/2301.12258)). The verifier has its own error floor. Without calibrating it on Bloop's own oscillator tones, tracker error will be reported as data error [INF].
- **ML-4 needs a long enough record.** Anomalies are standardly defined against a climatology (the normal value for that day of year) [V] ([s2stools](https://s2stools.readthedocs.io/en/stable/clim.html)), and seasonal variance can bias outlier detection [V] ([Netshiomvani et al.](https://datascience.maths.unitn.it/dssv2026/abstracts/Netshiomvani.html)). Records of 2.5–12 months cannot support a climatology, so "surprise" there means "unusual within this animation" [INF].
- **Heavy models stay offline.** WebGPU is on by default only for Android 12+ with Qualcomm/ARM GPUs [V] ([Chrome 121](https://developer.chrome.com/blog/new-in-webgpu-121)), and low-power mobile GPUs fit only the smallest models [V] ([LlamaWeb, arXiv 2605.20706](https://arxiv.org/html/2605.20706)). SAM 2, RAFT, VLMs and MusicGen should run offline, with results precomputed [INF].

**New options found.**

- **A live pitch-check meter** using SwiftF0 (95,842 parameters [V], [arXiv 2508.18440](https://arxiv.org/abs/2508.18440v1)) or Basic Pitch (Apache-2.0 [V], [GitHub](https://github.com/spotify/basic-pitch)): "measured X cents from data" in the jukebox. Licence and ONNX availability for SwiftF0 are unverified.
- **A safer ML-12**: A/B listener feedback restricted to free dimensions such as timbre, bed and reverb [INF].
- **A second arm for GAP-AI1** that feeds Bloop's own data melody into MusicGen-melody, so nobody can object "you didn't give the AI the data" [INF].
- **A five-part GAP-AI2 protocol** [INF]:
  1. value questions;
  2. extremes and location questions;
  3. absent-information questions, where the correct answer is to refuse;
  4. colorbar-cropped and colormap-flipped versions;
  5. the same questions with vs without Bloop's descriptive text.
- **A "decorative ML" test**: if removing a component changes no number or listener result, it is decorative [INF].

**Which ML components look worth building by 13 Nov.** The notes present this as decision support, not a verdict:

1. **Candidate 1: ML-8 + ML-7, "AI timbre, data pitch, measured."** About 3–4 hours. Fallback: ML-8 alone on oscillator tracks.
2. **Candidate 2: GAP-AI2, the VLM map-reading test.** About 3–4 hours.
3. **Candidate 3, left open for the team:** either
   - GAP-AI1's two-arm test: cheap and vivid, MusicGen used for comparison only; or
   - DP-ML1, learned inversion: a genuine fidelity gain only if a held-out-by-date test, stratified by DP-CV1 confidence, wins. Higher information value, but more likely to give a null result.

The notes deprioritise ML-2, ML-5, ML-9, ML-10, ML-14, ML-11 and ML-3, and ML-1 unless Farnebäck fails the OSCAR direction check. Plans would shift if DDSP setup takes over three hours, or if tracker floors exceed about 10 cents in Bloop's register.

**Cheapest tests.**

- **Tracker calibration (1 hour):** 20 sine and harmonic tones at 80–1000 Hz through CREPE, penn and pYIN.
- **DDSP vs oscillator (2–3 hours):** the same f0 track rendered both ways. Pass if DDSP is within the oscillator baseline + 5 cents.
- **VLM test (3–4 hours):** 50 items with an exact binomial confidence interval; record model name, version and date.
- **ML-4 ablation (1–2 hours):** z-score vs Isolation Forest on 5176.

## "custom computer vision algorithms" and "analyzes EIC visual frames": Bloop's real step beyond NASA is value recovery plus validation

**What the index already plans.**

- CV-A: nearest-colour inversion in CIELAB (a colour space designed so that equal distances look roughly equally different) with tick calibration. The team's own truth tests: SST 0.31 °C; 5176 91% sign agreement, ρ 0.79.
- DP-CV1 / `invert.py`: project each pixel onto the colormap curve; the distance from the curve becomes a confidence score.
- CV-10: legend auto-reader.
- `georef.py`, and DD §10, which measures how NASA mapped Caldwell 73.
- The GAP "GIBS any-layer record".

These numbers are the team's results, not re-checked here.

**What NASA precedents show.**

- **NASA's pieces map image properties, not physical units.** Chandra/SYSTEM Sounds use a small documented set of scan paths (left→right, bottom→top, radial outward, clockwise radar) and map position → pitch, brightness → volume and wavelength → instrument [V] ([Chandra sonify4](https://chandra.si.edu/photo/2021/sonify4/index.html); [Arcand et al. 2024](https://arxiv.org/pdf/2403.18082)). Every documented method maps these image properties; none recovers units from a colorbar. Bloop's inversion plus independent validation is **a real methodological step beyond the NASA precedent**. That doesn't make NASA's pieces "unfaithful": they map pixels faithfully [INF].
- **The main NASA evaluation measured opinions, not understanding.** Arcand et al. surveyed 3,184 respondents on self-reported enjoyment, learning and trust, with a small BLV subgroup of unreported size [V]. That leaves comprehension accuracy as a gap Bloop can fill cheaply [INF].
- **NASA itself coarsened pixels to cut noise.** The Deep Field piece was downsampled 4× "for more audible, consistent tones" [V], a precedent for the statement's "chaotic noise" warning.
- **No NASA Earth-frame method was found.** The researchers found no NASA Earth-science image sonification with a published method [V searches] ([nasa.gov/data-sonifications](https://www.nasa.gov/data-sonifications)). The one lead is an EIC interactive called **"Air Quality Orchestra"**, listed in an August 2026 EIC deck, whose method could not be found [V] ([FDLP EIC slides](https://fdlp.gov/sites/default/files/training/20260827-wn-nasa-earth-exhibits-programming-libraries-slides.pdf)). That it sonifies data at all is [HYP].
- **Pixel-to-note on NASA Earth imagery is prior art.** "Aria" by team Aria EarthMOOG (Space Apps 2018, **Global Nominee**) read GIBS tile pixels in the browser and mapped luminance and prominent colours to scale notes with Tone.js and Vibrant [V] ([2018 team page](https://2018.spaceappschallenge.org/challenges/help-others-discover-earth/artify-earth/teams/aria-earthmoog)). Bloop's difference must be stated as colorbar inversion → physical units + confidence + validation + frame-locked EIC pairing + measured BLV usability [INF].

**What SVS publishes.** The SVS API records show that SVS publishes **colorbar images, not lookup tables (LUTs)** [V] ([SVS API 3912](https://svs.gsfc.nasa.gov/api/3912)), so inversion remains necessary. Item by item [V]:

| Item | What SVS publishes | CV work it saves |
|---|---|---|
| 3912 | Frame-by-frame dates file; `orig/` frames with no colorbar; 310×95 colorbar PNG | OCR and linear time guesses; colorbar cropping |
| 5425 | Separate temperature, salinity, land-mask and datesOnly layers; three colorbar PNGs | Land-mask computation; OCR on the composite |
| 5518 ([API](https://svs.gsfc.nasa.gov/api/5518)) | **Per-species 2:1 equirectangular layers, each with its own colorbar** | Unmixing species from the 5533 composite, which has no colorbar file |
| 5572 | Separate transparent annotations layer | Label detection before segmentation |
| 4960 ([API](https://svs.gsfc.nasa.gov/api/4960)) | Date-overlay frames | OCR on the composite |
| 4950 ([API](https://svs.gsfc.nasa.gov/api/4950)) | Three colorbar TIFFs and no-colorbar frame sets | Colorbar cropping |
| 5196 ([API](https://svs.gsfc.nasa.gov/api/5196)) | A colorbar encoding colour **and opacity** on camera orbits only | Nothing; it confirms "relative ppm" and "pattern" claims |

SVS 13786 already states the Caldwell mapping (radar sweep, radius → pitch with "farther from the center … higher pitched", orange/red stars = marimba, blue = glockenspiel), but not the start angle, period or pitch range [V] ([SVS API 13786](https://svs.gsfc.nasa.gov/api/13786)). DD §10 becomes a confirmation test plus measuring the numbers [INF].

**What colour-inversion research and the synthetic tests add.**

- **Legend-based extraction is the better-evidenced route, and OCR is its weak link.** Poco et al.'s tick OCR F1 (a combined precision/recall score) was 78% for continuous legends, and automatic legend location worked only 50% of the time [V] ([Poco et al. 2018](https://pub-0ba4292bf23b48ceaee7d83b310f091c.r2.dev/files/papers/2018-ExtractingColorMappings-TVCG.pdf)).
- **Legend-free methods struggle on unfamiliar colormaps.** Their error roughly doubles on unseen colormaps (0.104 → 0.206) [V] ([Yuan et al.](https://ar5iv.labs.arxiv.org/html/2103.00741)). SVS uses custom bars, so that matters.
- **Compression costs little.** In the researchers' synthetic test [V-test], compression added a bounded error: worst case at H.264 CRF 28 4:2:0 was a 95th-percentile error of 1.53–2.55% of range, the same order as Bloop's 0.31 °C on a 0–32 °C bar.
- **Blending and shading cost a lot.** 20% alpha over grey gave 4–7% p95 error in Lab; soft hillshade gave 3.9–8.4% [V-test].
- **Un-blending fixes alpha completely.** Removing a known alpha and background before inversion **returned error to the clean 0.27%** [V-test].
- **ΔE2000 survives blending best.** It was the most robust colour-difference measure under blending (e.g. RdBu p95 3.65 vs 6.09 in Lab), and OKLab was worst [V-test]. Published work calls CAM16-UCS "the most versatile" colour-difference model [V] ([Basova et al. 2024](https://mdpi.com/2313-433X/10/12/317)).
- **The confidence score fails on rainbow maps.** DP-CV1's distance-to-curve signal tracked error well on viridis (Spearman ρ 0.79) but **not at all on jet** (ρ 0.06). A blended colour there lands on another part of the curve, so it looks confident and is wrong [V-test].

**New options found.** All [INF/HYP]:

- **Faster ΔE2000:** a Lab KD-tree top-k search re-ranked by ΔE2000. Adopt only if it is no worse than the 0.31 °C bar.
- **Better confidence:** add a 5×5 neighbourhood consistency check and a known-overlay mask (coastlines, OCR boxes) to the distance-to-curve signal.
- **Joint inversion for 5196:** solve for colour and opacity together.
- **Use the cleanest source:** prefer SVS PNG frame sets over MP4, and use the correct BT.709 colour matrix when MP4 is unavoidable.
- **Check OCR for free:** tick values on a linear bar must fit a straight line.

GIBS colormap XML ties each exact RGB to a value interval, with no OCR needed [V] ([GIBS docs](https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/)). Values are binned, PNG is required, and the docs contain their own errors. GIBS also offers a **ground-truth harness** for Bloop's generic inverter, but it is not EIC content [INF].

**Two coverage gaps.**

- **The EIC gallery is the best public match for the "Content Database".** The public SVS EIC gallery (ID 40467) lists Beauty Pieces 3912, 4950, **4993 (Dixie Fire)**, 4960, 5011, 5313, 5196, 5425 and 5533. 5669, 5572 and 13786 are not on it [V] ([SVS EIC gallery](https://svs.gsfc.nasa.gov/gallery/earth-information-center)). The "EIC Content Database" on the Resources tab is probably this gallery [INF].
- **4993 is not covered by the index.** Whether it is on the Challenge #14 Resources tab needs checking.

**Cheapest tests.**

- **Real compression cost (30 minutes):** invert the same frame from an SVS PNG set and from the MP4.
- **Colour-space choice (30 minutes):** Lab vs ΔE2000 re-rank on 20 hand-checked 3912 SST pixels using the real colorbar.
- **Confidence quality:** confidence-vs-error ρ on the 3912 truth set.
- **OCR masking:** tick OCR with coloured pixels masked vs unmasked, plus the straight-line fit.
- **GIBS round trip:** value → RGB → value on one PNG tile.
- **Free tool comparison (optional):** `unmap` (Apache-2.0) vs `invert.py` on one frame.

## Corrections to the index

Each row keeps the notes' labels. "Was" quotes or summarises the index; "Should be" is what the evidence supports.

| # | Index item | Was | Should be | Basis |
|---|---|---|---|---|
| 1 | ML-2 | "k-means + monotonic path; arXiv 2507.20632 method class" | 2507.20632 is a trained U-Net/MLP + B-spline colormap with per-image fine-tuning. It assumes linear mapping, reports **colormap error only, no value error**, and has no stated code licence. "k-means + path" is closer to Yuan et al. or `unmap`. Keep BACKLOG; admit only via Bloop's value truth test | [V] [arXiv](https://arxiv.org/html/2507.20632v2) |
| 2 | §7 Recorded local instruments | "Arcand study found listeners preferred real instruments [V]" | **PARTIALLY VERIFIED**: the authors inferred it from ratings and comments, with a fixed order that confounds it (the synthetic piece came last). Recording local instruments remains reasonable for licence ownership and identity | [V] [Frontiers](https://www.frontiersin.org/articles/10.3389/fcomm.2024.1288896) |
| 3 | CV-5, DP-OF, §2 `flow.py` | "speed in km/day" | Direction is reliable; speed is **underestimated on trail renders** (ratio 0.35–0.61 for long trails). Report relative speed, or a per-record scale factor fitted against OSCAR | [EXP], [V] Heitz et al. |
| 4 | DD §5 (5425) | "speed vs OSCAR" | Different quantities (3-D field, depth mixing, camera view, OSCAR's 0–30 m mean). Use a direction/pattern check only; streak-length velocimetry is an option | [V] SVS 5425, PO.DAAC; [INF] |
| 5 | DD §1, §2, §5, §7, §9 | Plan OCR, land masks, colorbar cropping, species unmixing | Use what SVS publishes: 3912 `flat_ecco2_dates.txt` + `orig/` frames; 5425 `dates/`, `land_mask/`, `temperature/`, `salinity/` + colorbar PNGs; **5518 per-species 2:1 layers + colorbars for 5533 values**; 5572 `Annotations/`; 4960 date overlay; 4950 colorbar TIFFs + no-colorbar frames | [V] SVS API records |
| 6 | DD §10 Caldwell | "Measure … how NASA mapped it" | SVS 13786 already **states** the mapping. Measuring pitch vs radius and instrument per colour is a confirmation test; the unknowns are start angle, direction, period and pitch range. Present Caldwell 73 as the borrowed NASA method (astronomy), not an Earth record | [V] SVS API 13786 |
| 7 | DP §2.2 brightness matching | Brightness → loudness; exponents 0.33/0.5 | Conflicts with grammar ("volume = confidence/coverage only"): use loudness only on unpitched voices, brightness → pitch elsewhere. Choose the exponent by mark type (point/flash 0.5–1). L* already contains the cube root; don't apply Stevens twice. Test by paired-comparison staircase | [V] Ellermeier; [INF] |
| 8 | DP §2.1 histogram chord | Each step "as loud as the area it covers" | Area → loudness clashes with the grammar unless defined as coverage. Equal-ΔE steps give 8–24 degrees; cap at about 3 voices; normalise steps per record | [V] Huron; [V-test]; [INF] |
| 9 | DP §2.3 shape → timbre | FD → harmonics; size → register | FD brightness is confounded by noise and object size (noisy small circle ≈ star). Size → register double-books pitch. Choose categorical timbre or declare a new channel | [V, own synthetic run]; [V] McAdams; [INF] |
| 10 | CV-8, DD §6 | "Blob detection of new flashes" | "New LIS detections (dots)". Validate against GHRC **group and flash** counts; name the ISS-LIS V1 version; add a coverage fallback where dots merge | [V] SVS 5011, Peterson & Rudlosky; [INF] |
| 11 | Fires (GAP, OR §3.2) | Geiger clicks per fire | "Per detection (a pixel containing ≥1 fire)" | [V] FIRMS FAQ |
| 12 | 5313/5475 "density/intensity → tempo" | Frame brightness as light level | In the change map, brightness = **magnitude of change**, not radiance; the scaling is undocumented. 5475 filenames say 2012–**2024** | [V] SVS 5313, 5475 |
| 13 | DP §2.4 polyrhythm | Compare densities across simultaneous bands | Polyrhythms are usually heard as integrated. Keep as A-side texture; analysis needs solo/step-through; test before claiming | [V abstract] Nijhuis 2026 |
| 14 | DP-CV1 confidence | Distance from curve flags problems | Blind on rainbow maps (jet ρ 0.06). Add a spatial-consistency check and an overlay mask; report ρ per colormap | [V-test] |
| 15 | ML-8 / ML-7 check | "Within 10 cents" with pYIN listed | Calibrate the trackers on known tones first; use CREPE (full, Viterbi) or penn as primary and pYIN as a cross-check only | [V] Kim 2018, Morrison et al. |
| 16 | ML-4 | Surprise detector | Short records cannot support a climatology; say "unusual within this animation" or use 5176 | [V] s2stools; [INF] |
| 17 | OR §3.3 eddy swirl | OW vorticity on flow | OW over-detects (about 70% excess on real SLA); require a closed contour too (hybrid) | [V] Yi et al. 2014 |
| 18 | CV-9 / DD §4 | Global hue classes | Per-item centroids (5552 uses cyan sea salt); DBSCAN as an alternative to k-means | [V] SVS 5572; [V] Poco |
| 19 | §21 credits, GAP note | Prior art partly listed | Cite **Aria (Space Apps 2018 Global Nominee)**, Badilla Cerdas (arXiv 2408.11461) and the Chandra scan presets; the GAP "Artify Earth sonified GIBS" note is now [V], though the 2018 challenge text itself never mentioned sound | [V] team page, challenge page |
| 20 | §1 coverage | "Covers all of them" | EIC Beauty Piece **4993 (Dixie Fire)** isn't in the index; check the Resources tab. Investigate "Air Quality Orchestra" | [V] SVS EIC gallery; FDLP deck |
| 21 | Record metadata | — | State known page inconsistencies: 5011 starts Jan vs Mar 2017; 4950 period 2019–20 vs 2018–19; a 5518 ozone file is named "NitrousOxides" | [V] SVS API records |

## Prioritised actions for the 12 days to the 13 November video

These priorities are the synthesis's own ordering of the cheapest tests the notes propose. They are a suggestion for the team to accept or change, not a verdict. Days 11–13 Nov are assumed to be reserved for making the video, so no new experiment should start after 10 Nov [INF].

**MUST (2–5 Nov).** Each removes a risk to something already DATA-NOW, or a claim Bloop is about to make.

| # | Action | Time | Why |
|---|---|---|---|
| M1 | **Today:** download the Black Marble annual files (VNP46A4) for 2012 and 2023 over Bangladesh and the check regions. NOAA confirms it ends delivery of all S-NPP VIIRS products at 13:00 UTC on 2 Nov 2026 (7 pm Dhaka) [V] ([NOAA NESDIS notice](https://www.nesdis.noaa.gov/news/cessation-of-suomi-national-polar-orbiting-partnership-s-npp-data-users-onafter-november-2-2026)). The notice does not say whether NASA's archive (LAADS) stays downloadable, so treat it as possibly closing | 30 min | Irreversible if missed |
| M2 | Apply the corrections table to the index and the DD/A3 prompts | 1 h | Stops wrong claims spreading into code and video |
| M3 | Switch to SVS-published assets (correction 5). `ffprobe -count_frames` on 3912 against the 2000-line dates file. Grep raw API JSON for `.txt/.csv/.xml/.cpt/.lut` | 2–3 h | Removes OCR and segmentation risk on the #1 and #2 priority records |
| M4 | `flow.py` on 3912: OSCAR angle + speed ratio, pairs (k, k+2) and (k, k+4); decide the "relative speed" wording | 2 h | Decides whether any km/day claim survives |
| M5 | Inversion triad on 3912 truth: PNG vs MP4 same frame; confidence-vs-error ρ; Lab vs top-k ΔE2000 | 2 h | Grounds the "custom CV" accuracy claim; must not regress below 0.31 °C |
| M6 | Pitch-tracker calibration: 20 known tones, CREPE / penn / pYIN | 1 h | Gate for any cents number on album tracks |
| M7 | Decide the three grammar clashes (brightness → loudness, area → loudness, size → register); log in the decision log | 1 h | A3's automated grammar check would otherwise fail, or be weakened |
| M8 | 5011 lit-pixel curve over 200 frames; rename to "detections"; plan the GHRC group + flash comparison | 45 min | Sets the double-count rule |
| M9 | Read the Aria repo's mapping; add Aria, Badilla Cerdas and the Chandra presets to "How Bloop hears". Check the Resources tab for the EIC Content Database link and 4993 | 1 h | Honest differentiation; coverage |
| M10 | Write the five-bullet "real time" wording with blanks; fill it from rVFC skip-rate and latency measurements on the actual demo devices | 2 h | The statement's own phrase; avoids an unmeasured claim |

**SHOULD (5–10 Nov).**

| # | Action | Time |
|---|---|---|
| S1 | One 2-hour formative session with 5 sighted classmates (index T5 style), bundling the chord count, Δk density, band attribution, three-way shape match with identical envelopes, turbo legend sentence and (if DP §2.2 stays) the brightness staircase. Report as "n = 5, formative". Combining them is the synthesis's suggestion; keep BLV sessions for the accessibility tasks already planned | 2 h + prep |
| S2 | ML candidate 1: ML-8 + ML-7 (DDSP). Check the ddsp licence first; fall back to ML-8 alone | 3–4 h |
| S3 | ML candidate 2: GAP-AI2, a 50-item VLM test with one open model, recording model, version and date | 3–4 h |
| S4 | Third ML slot: the team chooses GAP-AI1 (two-arm), DP-ML1 (stratified held-out) or neither. The notes do not pick | 3–4 h |
| S5 | FD noise check on 50 real masks; choose categorical vs continuous shape timbre | 1 h |
| S6 | 5425 datesOnly OCR + Theil–Sen fit | 30 min |
| S7 | Histogram-chord step normalisation (path length ÷ 7) on the 3912 and 5533 colorbars | 1 h |
| S8 | DBSCAN vs k-means on the hand-labelled aerosol pixels, with per-item centroids | 1 h |
| S9 | Smoothing choice (three WAVs) and hysteresis on the threshold bells | 1 h |
| S10 | GIBS colormap round-trip, if the GIBS record stays in scope | 1 h |
| S11 | Email the EIC (address in the Oct 2025 deck) or ask the challenge mentors about "Air Quality Orchestra" | 15 min |

**NICE (only if MUST and SHOULD are done).** These are:

- the PeriodicWave "strict shape" toggle;
- the in-browser live LUT probe and live pitch-check meter;
- tobac on the 5518 PM2.5 sequence;
- the OW-only vs hybrid eddy count on 5425;
- the SAM 2 vs threshold IoU ablation;
- the SEA-RAFT vs Farnebäck ablation on the synthetic renders;
- streak-length velocimetry on 5425;
- joint α inversion on 5196;
- the 5475 L* vs radiance regression;
- `unmap` vs `invert.py`;
- ML-12 A/B on free dimensions;
- ML-4 z-score vs Isolation Forest on 5176;
- STRAUSS for offline album renders (licence check first).

## Additions to the "do not claim" list

| Don't claim | Say instead |
|---|---|
| "Real-time computer vision" | "Values are extracted offline and checked; sound is synthesised live and locked to the displayed frame (skip rate x%, latency x ms on device y)" |
| Current speed in km/day from SVS animations | "Relative speed"; or a speed with the per-record scale factor and its OSCAR agreement stated |
| "One click per flash" / "per fire" | "Per LIS detection (dot)" / "per fire-detection pixel" |
| Night-lights brightness as light level or radiance | "Display brightness of the change map; relative, scaling undocumented" |
| Listeners can count events or compare densities across bands | Only the measured result of the Δk and band tests |
| Brightness–loudness matching is calibrated or validated | "Approximate perceptual matching based on population averages" |
| Shape timbre is intuitive, especially for blind users | "Taught with reference tones; n = X matched shapes at Y%" |
| Crossmodal mappings are universal | "Correspondences reported mainly in Western samples; tested with N Bangla speakers" |
| "First" Earth-imagery sonification, first FD → timbre, first colorbar chord | "We found no precedent in the sources we searched"; credit Aria 2018 and Badilla Cerdas 2024 |
| NASA's Caldwell mapping beyond what SVS states | SVS's own words, plus Bloop's measured numbers labelled as measurements |
| "SVS renders with software X" | Nothing (the only source is a 2008 archive page) |
| "Ears reveal subtle patterns" | "Makes large patterns audible"; report any detection test as measured (Astronify found sonification alone at about 25% vs plots about 70% at medium signal-to-noise [V] ([Tucker Brown et al. 2022](https://arxiv.org/pdf/2209.04465))) |
| ML improves accuracy | The ablation table (baseline vs ML vs truth), or "tested, no gain" |
| DDSP keeps data pitch exact | "Measured cents difference vs the oscillator baseline after tracker calibration" |
| "AI music can't follow data" / "VLMs misread NASA maps" in general | "In our N-item test on [date], model X…", with a confidence interval |
| Values are equally accurate everywhere | Per-pixel confidence and per-colormap confidence-vs-error ρ |
| "Surprise" as a climate anomaly on short records | "Unusual within this animation" |
| Arcand found listeners preferred real instruments | "Arcand et al. inferred a preference for instrumental pieces (order-confounded)" |

## What remains unverified

**Licences not checked from the repositories:**

- uwdata/rev; the `unmap` algorithm details;
- the 2507.20632 code and models (none stated);
- magenta/ddsp, ddsp-vst and RAVE;
- penn and SwiftF0, and Mustango's weights;
- RAFT, GMFlow, OpenCV, EasyOCR, Tesseract, tesseract.js, ONNX Runtime and mp4box.js;
- tobac, TAMS, TempestExtremes and shoot;
- MobileSAM on GitHub, STRAUSS, OneEuroFilter, pySTEPS, CLAP and DINOv2;
- scikit-image (believed BSD, general knowledge).

**Verified licences** that matter: MusicGen weights CC-BY-NC 4.0 (comparison use only); Stable Audio Open under the Stability Community License (under US$1M revenue); SAM 2 Apache-2.0; SAM 3 custom Meta licence; py-eddy-tracker GPL-3.0; Basic Pitch Apache-2.0; CREPE MIT; SEA-RAFT BSD-3; pyefd MIT; PaddleOCR Apache-2.0. For NASA media, NASA asks for acknowledgement, and the insignia is not public domain [V] ([NASA Brand Center](https://nasa.gov/nasa-brand-center/images-and-media)). Whether the Caldwell audio carries third-party rights was not stated, so link to SVS rather than redistributing it [INF].

**Blocked or unread sources:**

- Blocked in this session: SVS HTML pages (the API JSON was read instead), the arXiv abstract page for 2507.20632, the GitHub API, the Chandra companion repo (Jesstella/a_universe_of_sound), the Royal Society full text of Ćwiek et al., the PMC full texts of Spence 2011 and Palmer 2013, the ICAD "Hearing artificial intelligence" paper, the ffmpeg manual and MDN.
- Unread: arXiv 2610.40212 (colour judgement in multimodal LLMs, rate-limited; possibly directly relevant to GAP-AI2), MapQA and MAPWise, the Stevens & Marks 1965 originals, the primary ITU-R BT.1359 text, the full Nijhuis 2026 review, and Fryer 2014 / Hamilton-Fletcher 2018 on blind participants.
- Not read on SVS: 5436, 5276, 14983, the `CALDWELL73.en_US.SRT` captions and the last 16.7k characters of the 4950 record.
- SVS 5475 is equirectangular per one researcher's reading [V], but 5436's projection is unverified.

**Factual gaps:**

- Frame counts per SVS folder.
- Whether 3912's date file maps 1:1 to the 2048-px MP4.
- How 5011 renders a dot.
- The night-lights transfer function.
- Air Quality Orchestra's method.
- The EIC Terms & Conditions.
- Whether NASA's LAADS archive of S-NPP VIIRS products stays downloadable after NOAA's 2 Nov 2026 cut-off (the cut-off itself is verified).
- Any published accuracy for optical flow on SVS-style renders, any colour-sound data for Bangla speakers, and any browser audio-latency or CV timing measurements on budget phones.

## Conclusion

The research suggests Bloop's computer-vision depth is real but has been pointed partly at problems NASA already solved. Several hours of planned OCR, masking and species unmixing turn into downloading the right SVS layer. That frees time for the work only Bloop does: turning colours into checked physical values and showing exactly where that fails. The most useful single shift is from "CV that extracts more" to "CV that reports its own error": a speed scale factor instead of km/day, a confidence score whose reliability is measured per colormap, a cents error measured after calibrating the verifier. Each of these turns an engineering claim into evidence the team can show in the video.

On the perception side, the pattern is consistent. The index's mappings are plausible one at a time, but they collide when stacked. Too many chord notes, fused polyrhythms, and pitch doing double duty for value and size all push toward the "chaotic noise" the statement warns about. Short listener tests with five people are now the cheapest way to settle that, not more reading. ML follows the same logic. It earns its place in Bloop where it measures (pitch verification, VLM error rates, AI music vs data) rather than where it generates, and whichever third component the team picks, a documented null result counts as evidence too.
