export const rawPixelEn = {
  "raw.title": "Pixel to sound, or Bloop?",
  "raw.figureLabel": "Roughness: the naive scan against Bloop, measured",
  "raw.figure": (p: { naive: string; bloop: string }) => `${p.naive} against ${p.bloop}`,
  "raw.label": "Naive version shown for comparison; it is not how Bloop works.",
  "raw.explain":
    "One frame (SVS 3912, sea surface temperature), the same path row by row, 6 seconds each. The naive version turns each pixel's colour into a pitch; Bloop plays the real values through its written rule, and is silent over land.",
  "raw.naive": "Hear the naive version",
  "raw.bloop": "Hear Bloop",
  "raw.stop": "Stop",
  "raw.numbers": (p: { nf: string; nr: string; ne: string; bf: string; br: string; be: string }) =>
    `Naive: flatness ${p.nf}, roughness ${p.nr}, entropy ${p.ne}. Bloop: flatness ${p.bf}, roughness ${p.br}, entropy ${p.be}.`,
  "raw.scale": "Flatness and entropy run from 0 (one clean tone) to 1 (noise); roughness is summed over the strongest partials (higher is rougher).",
  "raw.hwgt.subject": "the naive and Bloop measurements",
  "raw.hwgt.method":
    "Both versions are rendered from the frame's decoded values (6 s, 22 050 samples a second) and measured over 2048-sample frames that sound: spectral flatness (geometric over arithmetic mean of the power), spectral entropy (normalised Shannon entropy) and roughness (Sethares' form of the Plomp and Levelt curve over each frame's 20 strongest peaks), averaged.",
  "raw.hwgt.n": (p: { naive: string; bloop: string }) => `${p.naive} sounding frames (naive), ${p.bloop} (Bloop)`,
  "raw.open": "Play both",
};
