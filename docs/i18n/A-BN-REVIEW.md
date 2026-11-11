# Bangla drafts from Session A, for review

Audit item A-bn, 2026-11-10. Every string below is a **draft** written by Session A, and it already shows in Bangla mode. Names, organisations and dataset titles (NASA, SVS, EIC, GIBS, MUR, NOAA Coral Reef Watch, record titles from the files) stay as in English; the colour amber is কমলা (`docs/i18n/GLOSSARY.md`). In built strings, `${…}` is a number or name the app fills in.

Order: controls, announcements, errors, headings, the rest. Files: `src/lib/i18n/bn/official.ts`, `braille.ts`, `truth.ts`, and the entries marked "review first" in `help.ts`, `captions.ts`, `panels.ts`, `context.ts`, `data.ts` and `rules.ts`.

## 1. Controls (buttons, tabs, fields, key help)

| Key | English | Bangla draft |
|---|---|---|
| `truth.unison.play` | Hear the nearest checked point | সবচেয়ে কাছের যাচাই করা বিন্দুটি শুনুন |
| `key.u.action` | Proof in unison: hear the nearest checked point (EIC frame tone, then NASA's file tone) | একসুরে প্রমাণ: সবচেয়ে কাছের যাচাই করা বিন্দুটি শুনুন (আগে EIC ফ্রেমের সুর, তারপর নাসার ফাইলের সুর) |
| `mode.official` | Official | অফিশিয়াল |
| `official.layer` | Layer | স্তর |
| `official.view` | Area | এলাকা |
| `official.view.global` | World | পৃথিবী |
| `official.view.box` | Bangladesh (hourly) | বাংলাদেশ (প্রতি ঘণ্টা) |
| `official.play` | Play | বাজান |
| `official.pause` | Pause | বিরতি দিন |
| `official.time` | Time step | সময়ের ধাপ |
| `official.speak` | Speak value | মান শুনুন |
| `official.details` | Details | বিস্তারিত |
| `official.tab.source` | Where it's from | কোথা থেকে এসেছে |
| `official.tab.controls` | Controls | নিয়ন্ত্রণ |
| `braille.open` | Braille explorer | ব্রেইল এক্সপ্লোরার |
| `braille.close` | Close braille explorer | ব্রেইল এক্সপ্লোরার বন্ধ করুন |
| `braille.channel` | Data | তথ্য |
| `braille.mode` | Shape | আকার |
| `braille.mode.time` | Through time | সময়ের সাথে |
| `braille.mode.path` | Along the latitude | অক্ষাংশ বরাবর |
| `braille.mode.grid` | 3 by 3 around the needle | সুইয়ের চারপাশে ৩ × ৩ |
| `braille.width` | Braille display width (cells) | ব্রেইল ডিসপ্লের প্রস্থ (সেল) |
| `braille.instructions.short` | Move the caret or press a routing key to move the needle. R reads the value. | সুই সরাতে ক্যারেট সরান বা রাউটিং কী চাপুন। R চাপলে মানটি শোনা যায়। |
| `braille.settings` | Display settings | প্রদর্শনের সেটিংস |
| `braille.howTo` | How to use | কীভাবে ব্যবহার করবেন |
| `braille.field` | Shape line field | আকার-লাইনের ঘর |
| `braille.field.hint` | Some braille displays work better with a single line. | কিছু ব্রেইল ডিসপ্লেতে এক লাইনই ভালো কাজ করে। |
| `braille.field.textarea` | Multi-line | একাধিক লাইন |
| `braille.field.input` | Single line | এক লাইন |
| `braille.degree` | Temperature unit in braille | ব্রেইলে তাপমাত্রার একক |
| `braille.degree.hint` | deg C reads more reliably on many displays. | অনেক ডিসপ্লেতে deg C বেশি নির্ভরযোগ্যভাবে পড়া যায়। |
| `braille.degree.word` | deg C | ডিগ্রি সে. |
| `braille.degree.symbol` | °C | °সে |
| `braille.preview` | Show braille dots | ব্রেইল বিন্দু দেখান |
| `braille.preview.hint` | Large visible dots, for sighted helpers. | বড় দৃশ্যমান বিন্দু, দেখতে পান এমন সহায়কদের জন্য। |
| `braille.on` | On | চালু |
| `braille.off` | Off | বন্ধ |
| `braille.previewNote` | Preview: your screen reader's braille table may differ. | পূর্বরূপ: আপনার স্ক্রিন রিডারের ব্রেইল টেবিল আলাদা হতে পারে। |
| `braille.review` | Review value (R) | মান কথায় শুনুন (R) |
| `braille.txt.show` | Braille-friendly text | ব্রেইল-বান্ধব লেখা |
| `braille.txt.download` | Download .txt | .txt ডাউনলোড করুন |
| `braille.bl.play` | Play | বাজান |
| `braille.bl.pause` | Pause | বিরতি দিন |
| `braille.bl.soundOn` | Sound on | শব্দ চালু |
| `braille.bl.sweep` | Sweep | সুইপ |
| `braille.bl.storm` | Storm | ঝড় |
| `braille.bl.stop` | Stop | থামান |
| `braille.bl.braille` | Braille | ব্রেইল |
| `braille.bl.keys` | Keys | কী |
| `braille.bl.speak` | Speak | বলুন |
| `braille.bl.record` | ${p.record} ${p.playing ? "playing" : "live"} | ${p.record} ${p.playing ? "বাজছে" : "লাইভ"} |
| `braille.bl.flip` | ${p.back ? "Front" : "Back"} ${p.record} | ${p.back ? "সামনে" : "পেছনে"} ${p.record} |
| `braille.bl.scene` | 3D ${p.scene} | থ্রিডি ${p.scene} |
| `braille.bl.map` | map | মানচিত্র |
| `braille.bl.shape` | shape | আকার |
| `braille.bl.save` | Save txt | txt রাখুন |
| `key.b.action` | Braille data explorer: feel the data as braille cells; its caret is the needle | ব্রেইল ডেটা এক্সপ্লোরার: তথ্যগুলো ব্রেইল সেল হিসেবে অনুভব করুন; এর ক্যারেট হলো সুই |
| `key.r.action` | In the braille explorer: review the value in words | ব্রেইল এক্সপ্লোরারে: মানটি কথায় শুনুন |
| `panel.history` | Month by month | মাসে মাসে |

## 2. Announcements and live text

| Key | English | Bangla draft |
|---|---|---|
| `unison.say` | Nearest checked point, ${formatInteger(p.km, "en")} km away, ${p.place}. Frame ${c2(p.frame)} degrees, NASA file ${c2(p.file)} degrees. The frame tone first, then the file tone joins. | সবচেয়ে কাছের যাচাই করা বিন্দু, ${int(p.km)} কিলোমিটার দূরে, ${p.place}। ফ্রেম ${c2(p.frame)} ডিগ্রি, … নাসার ফাইল ${c2(p.file)} ডিগ্রি। আগে ফ্রেমের সুর, তারপর ফাইলের সুর যোগ হয়। |
| `unison.loading` | The checked points are still loading. | যাচাই করা বিন্দুগুলো এখনো লোড হচ্ছে। |
| `caption.unison` | Proof in unison: frame ${c2(numParam(p, "frame") ?? 0)} °C, NASA file ${c2(numParam(p, "file") ?? 0)} °C, … ${formatFixed(numParam(p, "beats") ?? 0, "en", 1)} beats a second | একসুরে প্রমাণ: ফ্রেম ${c2(numParam(p, "frame") ?? 0)} °সে, নাসার ফাইল ${c2(numParam(p, "file") ?? 0)} °সে, … সেকেন্ডে ${n1(numParam(p, "beats") ?? 0)}টি বিট |
| `official.loading` | Loading the records | রেকর্ডগুলো লোড হচ্ছে |
| `official.related.loading` | Loading the related records | সম্পর্কিত রেকর্ডগুলো লোড হচ্ছে |
| `official.map` | ${p.layer}, ${p.time}. Under the needle: ${p.reading}. Arrow keys move the needle. | ${p.layer}, ${p.time}। সুইয়ের নিচে: ${p.reading}। তীর-কী দিয়ে সুই সরান। |
| `braille.modeAnnounce` | Shape: ${p.mode} | আকার: ${p.mode} |
| `braille.reviewOn` | Review on | কথায় শোনা চালু |
| `braille.reviewOff` | Review off | কথায় শোনা বন্ধ |
| `braille.loading` | Loading the shape | আকার লোড হচ্ছে |
| `braille.reviewLine` | ${p.name} ${p.value} at ${p.place}${p.time ? … : ""}, ${p.badge}${p.status ? … : ""} | ${p.name} ${p.value}, ${p.place}${p.time ? … : ""}, ${p.badge}${p.status ? … : ""} |
| `caption.water.gapTexture` | Soft ticks: no satellite measurement for ${from} … Soft ticks: no satellite measurements, ${from} to ${to} | নরম টিক: ${from}-এ কোনো স্যাটেলাইট পরিমাপ নেই … নরম টিক: ${from} থেকে ${to} পর্যন্ত কোনো স্যাটেলাইট পরিমাপ নেই |

## 3. Errors

| Key | English | Bangla draft |
|---|---|---|
| `truth.anomaly.error` | Couldn't load the anomaly check. Reload the page to try again. | অস্বাভাবিকতার যাচাই লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন। |
| `official.error` | Couldn't load the official records. Reload the page to try again. | অফিশিয়াল রেকর্ডগুলো লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন। |
| `official.related.error` | Couldn't load the related records. | সম্পর্কিত রেকর্ডগুলো লোড করা যায়নি। |

## 4. Headings and labels

| Key | English | Bangla draft |
|---|---|---|
| `truth.anomaly.heading` | Ocean temperature vs normal | স্বাভাবিকের তুলনায় সমুদ্রের তাপমাত্রা |
| `truth.threeway.heading` | Three readings of the same points | একই বিন্দুর তিনটি পাঠ |
| `truth.unison.heading` | Proof in unison | একসুরে প্রমাণ |
| `credits.products` | Data in this app | এই অ্যাপের তথ্য |
| `official.heading` | NASA's Challenge resources, as data | নাসার চ্যালেঞ্জের উপকরণ, তথ্য হিসেবে |
| `official.records` | Records | রেকর্ড |
| `official.related.heading` | Related NASA visualizations | সম্পর্কিত নাসা ভিজ্যুয়ালাইজেশন |
| `official.provenance` | Where this comes from | এটি কোথা থেকে এসেছে |
| `official.period` | Period | সময়কাল |
| `official.frameTime` | Frame times | ফ্রেমের সময় |
| `official.georef` | Map position | মানচিত্রে অবস্থান |
| `official.credits` | Credits | কৃতজ্ঞতা |
| `official.licence` | Licence | লাইসেন্স |
| `official.description` | From the SVS page | SVS পাতা থেকে |
| `official.checks` | Checks | যাচাই |
| `braille.heading` | Braille data explorer | ব্রেইল ডেটা এক্সপ্লোরার |
| `braille.valueLine` | Value line | মান-লাইন |
| `braille.shapeLine` | Shape line | আকার-লাইন |
| `braille.shapeRole` | braille shape | ব্রেইল আকার |
| `braille.scale` | Scale | স্কেল |
| `braille.relativeScale` | Relative shape, scale | আপেক্ষিক আকার, স্কেল |
| `braille.txt.heading` | Braille-friendly text | ব্রেইল-বান্ধব লেখা |

## 5. The rest (sentences, values, levels)

| Key | English | Bangla draft |
|---|---|---|
| `truth.anomaly.sentence` | SST anomaly checked against NOAA Coral Reef Watch: same sign at ${formatInteger(p.signPct, "en")}% of ${formatInteger(p.n, "en")} points; reads ${c2(Math.abs(p.offset))} °C ${p.offset < 0 ? "cooler" : "warmer"} (different baselines). | NOAA Coral Reef Watch-এর সাথে মিলিয়ে দেখা সমুদ্রপৃষ্ঠের তাপমাত্রার অস্বাভাবিকতা: ${int(p.n)}টি বিন্দুর ${int(p.signPct)}%-এ একই দিক; … ${c2(Math.abs(p.offset))} °সে ${p.offset < 0 ? "বেশি শীতল" : "বেশি উষ্ণ"} দেখায় (ভিত্তিকাল আলাদা)। |
| `truth.threeway.sentence` | At ${formatInteger(p.n, "en")} points, NASA's GIBS map layer and the MUR file differ by a median of ${c2(p.gibs)} °C; … the EIC picture and the MUR file by ${c2(p.frame)} °C. ${formatInteger(p.decodePct, "en")}% of GIBS pixels decode to a value. | ${int(p.n)}টি বিন্দুতে নাসার GIBS মানচিত্র-স্তর ও MUR ফাইলের মধ্যমা পার্থক্য ${c2(p.gibs)} °সে; … EIC ছবি ও MUR ফাইলের ${c2(p.frame)} °সে। GIBS-এর ${int(p.decodePct)}% পিক্সেল থেকে মান পড়া যায়। |
| `truth.unison.explain` | Two tones: one from the EIC picture, one from NASA's file. Beats mean they disagree. ${c2(p.median)} °C ≈ ${c2(p.semitones)} of a semitone. | দুটি সুর: একটি EIC ছবি থেকে, একটি নাসার ফাইল থেকে। বিট শোনা গেলে দুটো মেলেনি। ${c2(p.median)} °সে ≈ এক সেমিটোনের ${c2(p.semitones)} ভাগ। |
| `truth.unison.helix` | Proof helix: the frame's strand and the file's strand turn round each other ${formatFixed(p.beats, "en", 1)} times a second (they merge when the values agree). | প্রমাণের হেলিক্স: ফ্রেমের সুতো আর ফাইলের সুতো সেকেন্ডে ${n1(p.beats)} বার একে অপরকে ঘিরে ঘোরে (মান মিললে দুটো এক হয়ে যায়)। |
| `truth.unison.pair` | Frame ${c2(p.frame)} °C, NASA file ${c2(p.file)} °C: ${formatFixed(p.beats, "en", 1)} beats per second. | ফ্রেম ${c2(p.frame)} °সে, নাসার ফাইল ${c2(p.file)} °সে: সেকেন্ডে ${n1(p.beats)}টি বিট। |
| `official.intro` | Each record is one official SVS visualization, read back into values. Plain sound only: one voice per record. | প্রতিটি রেকর্ড নাসার একটি অফিশিয়াল SVS ভিজ্যুয়ালাইজেশন, যা থেকে আবার মান পড়া হয়েছে। শুধু সাদামাটা শব্দ: প্রতি রেকর্ডে একটি কণ্ঠ। |
| `official.related.intro` | Items NASA may add: each sits beside the official record it relates to, grouped by EIC focus area, with the same provenance and checks. | যেসব জিনিস নাসা যোগ করতে পারে: প্রতিটি থাকে যে অফিশিয়াল রেকর্ডের সাথে সম্পর্কিত তার পাশে, EIC-এর বিষয় অনুযায়ী সাজানো, একই উৎস-তথ্য ও যাচাইসহ। |
| `official.related.beside` | beside SVS ${p.ids} | SVS ${d(p.ids)}-এর পাশে |
| `official.focus.sea level` | Sea level | সমুদ্রপৃষ্ঠের উচ্চতা |
| `official.focus.air quality` | Air quality | বাতাসের মান |
| `official.focus.biodiversity` | Biodiversity | জীববৈচিত্র্য |
| `official.focus.wildfires` | Wildfires | দাবানল |
| `official.focus.greenhouse gases` | Greenhouse gases | গ্রিনহাউস গ্যাস |
| `official.focus.energy` | Energy | শক্তি |
| `official.focus.disasters` | Disasters | দুর্যোগ |
| `official.focus.water resources` | Water resources | পানিসম্পদ |
| `official.focus.agriculture` | Agriculture | কৃষি |
| `official.focus.other` | Other | অন্যান্য |
| `official.timeValue` | ${p.time} (step ${p.step} of ${p.total}) | ${p.time} (${int(p.total)}টির মধ্যে ${int(p.step)} নম্বর ধাপ) |
| `official.approximate` | approximate time | আনুমানিক সময় |
| `official.value` | ${p.value} ${p.unit} | ${p.value} ${p.unit} |
| `official.below` | below ${p.value} ${p.unit} (colorbar minimum) | ${p.value} ${p.unit}-এর নিচে (রঙের স্কেলের সর্বনিম্ন) |
| `official.atLimit` | at or below ${p.value} ${p.unit} (colorbar limit) | ${p.value} ${p.unit} বা তার নিচে (রঙের স্কেলের সীমা) |
| `official.noValue` | No value here | এখানে কোনো মান নেই |
| `official.pattern` | ${p.level} (pattern only: no number, the values are not verified) | ${p.level} (শুধু নকশা: কোনো সংখ্যা নেই, মানগুলো যাচাই করা নয়) |
| `level.veryLow` | very low | খুব কম |
| `level.low` | low | কম |
| `level.middle` | middle | মাঝারি |
| `level.high` | high | বেশি |
| `level.veryHigh` | very high | খুব বেশি |
| `official.framePos` | picture position ${p.x}% across, ${p.y}% up (no map position) | ছবির অবস্থান: বাঁ দিক থেকে ${d(p.x)}%, নিচ থেকে ${d(p.y)}% (মানচিত্রে অবস্থান নেই) |
| `official.svs` | SVS ${p.id} | SVS ${int(p.id)} |
| `official.frameTime.count` | ${p.count} ${p.count === 1 ? "frame" : "frames"} | ${int(p.count)}টি ফ্রেম |
| `official.georef.iou` | Map lines up with coastlines (score ${p.iou}, pass ${p.passAt}) | মানচিত্র উপকূলরেখার সাথে মেলে (স্কোর ${d(p.iou)}, পাসের সীমা ${d(p.passAt)}) |
| `official.voiceSource` | Voice from ${p.label} (${p.badge}), ${p.period} | কণ্ঠের উৎস ${p.label} (${p.badge}), ${p.period} |
| `official.check.pass` | pass | পাস |
| `official.check.miss` | missed the provisional threshold | অস্থায়ী সীমা পার হয়নি |
| `official.check.none` | no threshold | কোনো সীমা নেই |
| `official.size` | ${formatFixed(p.mb, "en", 1)} MB of data | ${formatFixed(p.mb, "bn", 1)} মেগাবাইট তথ্য |
| `braille.instructions` | The shape line holds the data as braille cells. Move its caret, or press a routing key, to move the needle: the sound and the value line follow. R reviews the value in words. Escape closes. | আকার-লাইনে তথ্যগুলো ব্রেইল সেল হিসেবে থাকে। এর ক্যারেট সরান, বা রাউটিং কী চাপুন, সুই সরে যাবে: শব্দ আর মান-লাইন সাথে সাথে বদলায়। R চাপলে মানটি কথায় শোনা যায়। Escape চাপলে বন্ধ হয়। |
| `braille.noData` | no data | তথ্য নেই |
| `braille.dry` | dry | শুকনো |
| `braille.snow` | snow | তুষার |
| `braille.atOrBelow` | at or below ${p.value} | ${p.value} বা তার নিচে |
| `braille.name.ocean` | Sea surface temperature | সমুদ্রপৃষ্ঠের তাপমাত্রা |
| `braille.name.rain` | Rain | বৃষ্টি |
| `braille.words.mmh` | millimetres per hour | মিলিমিটার প্রতি ঘণ্টা |
| `braille.words.degC` | degrees C | ডিগ্রি সেলসিয়াস |
| `braille.words.observation` | observation | পর্যবেক্ষণ |
| `braille.frame` | x${p.x} y${p.y} | x${d(p.x)} y${d(p.y)} |
| `braille.txt.note` | Plain text, wrapped at your display width, for a braille note-taker. | সাধারণ লেখা, আপনার ডিসপ্লের প্রস্থে ভাঙা, ব্রেইল নোট-টেকারের জন্য। |
| `field.veg.summary` | Vegetation index (NDVI) at ${p.place}, ${p.then} against ${p.now} (${p.dataset}). | ${p.place}-এ উদ্ভিদ সূচক (NDVI), ${p.then} বনাম ${p.now} (${p.dataset})। |

## 6. Data-file sentences and rule words

In `src/lib/i18n/bn/data.ts` (marked "Drafts, review first") and `src/lib/i18n/bn/rules.ts`: the sentences from mapping.json's newer voices (the normal tone, clarity, proof in unison, water's legend, the stale hiss), the units "°C vs normal" and "hours since a 1 km infrared look", the word for echo length (প্রতিধ্বনির দৈর্ঘ্য), and the Bangla "same rule as" sentence for proof in unison.
