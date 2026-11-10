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
| `official.pause` | Pause | থামান |
| `official.time` | Time step | সময়ের ধাপ |
| `official.speak` | Speak value | মান শুনুন |
| `official.details` | Details | বিস্তারিত |
| `official.tab.source` | Where it's from | কোথা থেকে এসেছে |
| `official.tab.controls` | Controls | নিয়ন্ত্রণ |
| `braille.open` | Braille explorer | ব্রেইল এক্সপ্লোরার |
| `braille.close` | Close braille explorer | ব্রেইল এক্সপ্লোরার বন্ধ করুন |
| `braille.channel` | Voice | কণ্ঠ |
| `braille.mode` | Shape shows | আকারে দেখায় |
| `braille.mode.time` | Through time | সময়ের সাথে |
| `braille.mode.path` | Along the latitude | অক্ষাংশ বরাবর |
| `braille.mode.grid` | 3 by 3 around the needle | সুইয়ের চারপাশে ৩ × ৩ |
| `braille.width` | Display width (cells) | ডিসপ্লের প্রস্থ (সেল) |
| `braille.field` | Shape field | আকারের ঘর |
| `braille.field.textarea` | Text area | টেক্সট এরিয়া |
| `braille.field.input` | Single line | এক লাইন |
| `braille.degree` | Degrees | ডিগ্রি |
| `braille.degree.word` | deg C | ডিগ্রি সে. |
| `braille.degree.symbol` | °C | °সে |
| `braille.review` | Review value (R) | মান কথায় শুনুন (R) |
| `braille.txt.show` | Braille-friendly text | ব্রেইল-বান্ধব লেখা |
| `braille.txt.download` | Download .txt | .txt ডাউনলোড করুন |
| `braille.bl.play` | Play | বাজান |
| `braille.bl.pause` | Pause | থামান |
| `braille.bl.soundOn` | Sound on | শব্দ চালু |
| `braille.bl.sweep` | Sweep | সুইপ |
| `braille.bl.storm` | Storm | ঝড় |
| `braille.bl.stop` | Stop | বন্ধ |
| `braille.bl.braille` | Braille | ব্রেইল |
| `braille.bl.keys` | Keys | কী |
| `braille.bl.speak` | Speak | বলুন |
| `braille.bl.record` | ${p.record} ${p.playing ? "playing" : "live"} | ${p.record} ${p.playing ? "\u09AC\u09BE\u099C\u099B\u09C7" : "\u09B2\u09BE\u0987\u09AD"} |
| `braille.bl.flip` | ${p.back ? "Front" : "Back"} ${p.record} | ${p.back ? "\u09B8\u09BE\u09AE\u09A8\u09C7" : "\u09AA\u09C7\u099B\u09A8\u09C7"} ${p.record} |
| `braille.bl.scene` | 3D ${p.scene} | \u09A5\u09CD\u09B0\u09BF\u09A1\u09BF ${p.scene} |
| `braille.bl.map` | map | মানচিত্র |
| `braille.bl.shape` | shape | আকার |
| `braille.bl.save` | Save txt | txt রাখুন |
| `key.b.action` | Braille data explorer: feel the data as braille cells; its caret is the needle | ব্রেইল ডেটা এক্সপ্লোরার: তথ্যগুলো ব্রেইল সেল হিসেবে অনুভব করুন; এর ক্যারেট হলো সুই |
| `key.r.action` | In the braille explorer: review the value in words | ব্রেইল এক্সপ্লোরারে: মানটি কথায় শুনুন |
| `panel.history` | Month by month | মাসে মাসে |

## 2. Announcements and live text

| Key | English | Bangla draft |
|---|---|---|
| `unison.say` | Nearest checked point, ${formatInteger(p.km, "en")} km away, ${p.place}. Frame ${c2(p.frame)} degrees, NASA file ${c2(p.file)} degrees. The frame tone first, then the file tone joins. | \u09B8\u09AC\u099A\u09C7\u09AF\u09BC\u09C7 \u0995\u09BE\u099B\u09C7\u09B0 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09AC\u09BF\u09A8\u09CD\u09A6\u09C1, ${int(p.km)} \u0995\u09BF\u09B2\u09CB\u09AE\u09BF\u099F\u09BE\u09B0 \u09A6\u09C2\u09B0\u09C7, ${p.place}\u0964 \u09AB\u09CD\u09B0\u09C7\u09AE ${c2(p.frame)} \u09A1\u09BF\u0997\u09CD\u09B0\u09BF, … \u09A8\u09BE\u09B8\u09BE\u09B0 \u09AB\u09BE\u0987\u09B2 ${c2(p.file)} \u09A1\u09BF\u0997\u09CD\u09B0\u09BF\u0964 \u0986\u0997\u09C7 \u09AB\u09CD\u09B0\u09C7\u09AE\u09C7\u09B0 \u09B8\u09C1\u09B0, \u09A4\u09BE\u09B0\u09AA\u09B0 \u09AB\u09BE\u0987\u09B2\u09C7\u09B0 \u09B8\u09C1\u09B0 \u09AF\u09CB\u0997 \u09B9\u09AF\u09BC\u0964 |
| `unison.loading` | The checked points are still loading. | যাচাই করা বিন্দুগুলো এখনো লোড হচ্ছে। |
| `caption.unison` | Proof in unison: frame ${c2(numParam(p, "frame") ?? 0)} \xB0C, NASA file ${c2(numParam(p, "file") ?? 0)} \xB0C, … ${formatFixed(numParam(p, "beats") ?? 0, "en", 1)} beats a second | \u098F\u0995\u09B8\u09C1\u09B0\u09C7 \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3: \u09AB\u09CD\u09B0\u09C7\u09AE ${c2(numParam(p, "frame") ?? 0)} \xB0\u09B8\u09C7, \u09A8\u09BE\u09B8\u09BE\u09B0 \u09AB\u09BE\u0987\u09B2 ${c2(numParam(p, "file") ?? 0)} \xB0\u09B8\u09C7, … \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1\u09C7 ${n1(numParam(p, "beats") ?? 0)}\u099F\u09BF \u09AC\u09BF\u099F |
| `official.loading` | Loading the records | রেকর্ডগুলো লোড হচ্ছে |
| `official.related.loading` | Loading the related records | সম্পর্কিত রেকর্ডগুলো লোড হচ্ছে |
| `official.map` | ${p.layer}, ${p.time}. Under the needle: ${p.reading}. Arrow keys move the needle. | ${p.layer}, ${p.time}\u0964 \u09B8\u09C1\u0987\u09AF\u09BC\u09C7\u09B0 \u09A8\u09BF\u099A\u09C7: ${p.reading}\u0964 \u09A4\u09C0\u09B0-\u0995\u09C0 \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B8\u09C1\u0987 \u09B8\u09B0\u09BE\u09A8\u0964 |
| `braille.modeAnnounce` | Shape: ${p.mode} | \u0986\u0995\u09BE\u09B0: ${p.mode} |
| `braille.reviewOn` | Review on | কথায় শোনা চালু |
| `braille.reviewOff` | Review off | কথায় শোনা বন্ধ |
| `braille.loading` | Loading the shape | আকার লোড হচ্ছে |
| `braille.reviewLine` | ${p.name} ${p.value} at ${p.place}${p.time ? … : ""}, ${p.badge}${p.status ? … : ""} | ${p.name} ${p.value}, ${p.place}${p.time ? … : ""}, ${p.badge}${p.status ? … : ""} |
| `caption.water.gapTexture` | Soft ticks: no satellite measurement for ${from} … Soft ticks: no satellite measurements, ${from} to ${to} | \u09A8\u09B0\u09AE \u099F\u09BF\u0995: ${from}-\u098F \u0995\u09CB\u09A8\u09CB \u09B8\u09CD\u09AF\u09BE\u099F\u09C7\u09B2\u09BE\u0987\u099F \u09AA\u09B0\u09BF\u09AE\u09BE\u09AA \u09A8\u09C7\u0987 … \u09A8\u09B0\u09AE \u099F\u09BF\u0995: ${from} \u09A5\u09C7\u0995\u09C7 ${to} \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4 \u0995\u09CB\u09A8\u09CB \u09B8\u09CD\u09AF\u09BE\u099F\u09C7\u09B2\u09BE\u0987\u099F \u09AA\u09B0\u09BF\u09AE\u09BE\u09AA \u09A8\u09C7\u0987 |

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
| `braille.preview` | Braille preview | ব্রেইলের পূর্বরূপ |
| `braille.scale` | Scale | মাপকাঠি |
| `braille.relativeScale` | Relative shape, scale | আপেক্ষিক আকার, মাপকাঠি |
| `braille.txt.heading` | Braille-friendly text | ব্রেইল-বান্ধব লেখা |

## 5. The rest (sentences, values, levels)

| Key | English | Bangla draft |
|---|---|---|
| `truth.anomaly.sentence` | SST anomaly checked against NOAA Coral Reef Watch: same sign at ${formatInteger(p.signPct, "en")}% of ${formatInteger(p.n, "en")} points; reads ${c2(Math.abs(p.offset))} \xB0C ${p.offset < 0 ? "cooler" : "warmer"} (different baselines). | NOAA Coral Reef Watch-\u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A6\u09C7\u0996\u09BE \u09B8\u09AE\u09C1\u09A6\u09CD\u09B0\u09AA\u09C3\u09B7\u09CD\u09A0\u09C7\u09B0 \u09A4\u09BE\u09AA\u09AE\u09BE\u09A4\u09CD\u09B0\u09BE\u09B0 \u0985\u09B8\u09CD\u09AC\u09BE\u09AD\u09BE\u09AC\u09BF\u0995\u09A4\u09BE: ${int(p.n)}\u099F\u09BF \u09AC\u09BF\u09A8\u09CD\u09A6\u09C1\u09B0 ${int(p.signPct)}%-\u098F \u098F\u0995\u0987 \u09A6\u09BF\u0995; … ${c2(Math.abs(p.offset))} \xB0\u09B8\u09C7 ${p.offset < 0 ? "\u09AC\u09C7\u09B6\u09BF \u09B6\u09C0\u09A4\u09B2" : "\u09AC\u09C7\u09B6\u09BF \u0989\u09B7\u09CD\u09A3"} \u09A6\u09C7\u0996\u09BE\u09AF\u09BC (\u09AD\u09BF\u09A4\u09CD\u09A4\u09BF\u0995\u09BE\u09B2 \u0986\u09B2\u09BE\u09A6\u09BE)\u0964 |
| `truth.threeway.sentence` | At ${formatInteger(p.n, "en")} points, NASA's GIBS map layer and the MUR file differ by a median of ${c2(p.gibs)} \xB0C; … the EIC picture and the MUR file by ${c2(p.frame)} \xB0C. ${formatInteger(p.decodePct, "en")}% of GIBS pixels decode to a value. | ${int(p.n)}\u099F\u09BF \u09AC\u09BF\u09A8\u09CD\u09A6\u09C1\u09A4\u09C7 \u09A8\u09BE\u09B8\u09BE\u09B0 GIBS \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0-\u09B8\u09CD\u09A4\u09B0 \u0993 MUR \u09AB\u09BE\u0987\u09B2\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09AE\u09BE \u09AA\u09BE\u09B0\u09CD\u09A5\u0995\u09CD\u09AF ${c2(p.gibs)} \xB0\u09B8\u09C7; … EIC \u099B\u09AC\u09BF \u0993 MUR \u09AB\u09BE\u0987\u09B2\u09C7\u09B0 ${c2(p.frame)} \xB0\u09B8\u09C7\u0964 GIBS-\u098F\u09B0 ${int(p.decodePct)}% \u09AA\u09BF\u0995\u09CD\u09B8\u09C7\u09B2 \u09A5\u09C7\u0995\u09C7 \u09AE\u09BE\u09A8 \u09AA\u09A1\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 |
| `truth.unison.explain` | Two tones: one from the EIC picture, one from NASA's file. Beats mean they disagree. ${c2(p.median)} \xB0C \u2248 ${c2(p.semitones)} of a semitone. | \u09A6\u09C1\u099F\u09BF \u09B8\u09C1\u09B0: \u098F\u0995\u099F\u09BF EIC \u099B\u09AC\u09BF \u09A5\u09C7\u0995\u09C7, \u098F\u0995\u099F\u09BF \u09A8\u09BE\u09B8\u09BE\u09B0 \u09AB\u09BE\u0987\u09B2 \u09A5\u09C7\u0995\u09C7\u0964 \u09AC\u09BF\u099F \u09B6\u09CB\u09A8\u09BE \u0997\u09C7\u09B2\u09C7 \u09A6\u09C1\u099F\u09CB \u09AE\u09C7\u09B2\u09C7\u09A8\u09BF\u0964 ${c2(p.median)} \xB0\u09B8\u09C7 \u2248 \u098F\u0995 \u09B8\u09C7\u09AE\u09BF\u099F\u09CB\u09A8\u09C7\u09B0 ${c2(p.semitones)} \u09AD\u09BE\u0997\u0964 |
| `truth.unison.helix` | Proof helix: the frame's strand and the file's strand turn round each other ${formatFixed(p.beats, "en", 1)} times a second (they merge when the values agree). | \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3\u09C7\u09B0 \u09B9\u09C7\u09B2\u09BF\u0995\u09CD\u09B8: \u09AB\u09CD\u09B0\u09C7\u09AE\u09C7\u09B0 \u09B8\u09C1\u09A4\u09CB \u0986\u09B0 \u09AB\u09BE\u0987\u09B2\u09C7\u09B0 \u09B8\u09C1\u09A4\u09CB \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1\u09C7 ${n1(p.beats)} \u09AC\u09BE\u09B0 \u098F\u0995\u09C7 \u0985\u09AA\u09B0\u0995\u09C7 \u0998\u09BF\u09B0\u09C7 \u0998\u09CB\u09B0\u09C7 (\u09AE\u09BE\u09A8 \u09AE\u09BF\u09B2\u09B2\u09C7 \u09A6\u09C1\u099F\u09CB \u098F\u0995 \u09B9\u09AF\u09BC\u09C7 \u09AF\u09BE\u09AF\u09BC)\u0964 |
| `truth.unison.pair` | Frame ${c2(p.frame)} \xB0C, NASA file ${c2(p.file)} \xB0C: ${formatFixed(p.beats, "en", 1)} beats per second. | \u09AB\u09CD\u09B0\u09C7\u09AE ${c2(p.frame)} \xB0\u09B8\u09C7, \u09A8\u09BE\u09B8\u09BE\u09B0 \u09AB\u09BE\u0987\u09B2 ${c2(p.file)} \xB0\u09B8\u09C7: \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1\u09C7 ${n1(p.beats)}\u099F\u09BF \u09AC\u09BF\u099F\u0964 |
| `official.intro` | Each record is one official SVS visualization, read back into values. Plain sound only: one voice per record. | প্রতিটি রেকর্ড নাসার একটি অফিশিয়াল SVS ভিজ্যুয়ালাইজেশন, যা থেকে আবার মান পড়া হয়েছে। শুধু সাদামাটা শব্দ: প্রতি রেকর্ডে একটি কণ্ঠ। |
| `official.related.intro` | Items NASA may add: each sits beside the official record it relates to, grouped by EIC focus area, with the same provenance and checks. | যেসব জিনিস নাসা যোগ করতে পারে: প্রতিটি থাকে যে অফিশিয়াল রেকর্ডের সাথে সম্পর্কিত তার পাশে, EIC-এর বিষয় অনুযায়ী সাজানো, একই উৎস-তথ্য ও যাচাইসহ। |
| `official.related.beside` | beside SVS ${p.ids} | SVS ${d(p.ids)}-\u098F\u09B0 \u09AA\u09BE\u09B6\u09C7 |
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
| `official.timeValue` | ${p.time} (step ${p.step} of ${p.total}) | ${p.time} (${int(p.total)}\u099F\u09BF\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 ${int(p.step)} \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A7\u09BE\u09AA) |
| `official.approximate` | approximate time | আনুমানিক সময় |
| `official.value` | ${p.value} ${p.unit} | ${p.value} ${p.unit} |
| `official.below` | below ${p.value} ${p.unit} (colorbar minimum) | ${p.value} ${p.unit}-\u098F\u09B0 \u09A8\u09BF\u099A\u09C7 (\u09B0\u0999\u09C7\u09B0 \u09AE\u09BE\u09AA\u0995\u09BE\u09A0\u09BF\u09B0 \u09B8\u09B0\u09CD\u09AC\u09A8\u09BF\u09AE\u09CD\u09A8) |
| `official.atLimit` | at or below ${p.value} ${p.unit} (colorbar limit) | ${p.value} ${p.unit} \u09AC\u09BE \u09A4\u09BE\u09B0 \u09A8\u09BF\u099A\u09C7 (\u09B0\u0999\u09C7\u09B0 \u09AE\u09BE\u09AA\u0995\u09BE\u09A0\u09BF\u09B0 \u09B8\u09C0\u09AE\u09BE) |
| `official.noValue` | No value here | এখানে কোনো মান নেই |
| `official.pattern` | ${p.level} (pattern only: no number, the values are not verified) | ${p.level} (\u09B6\u09C1\u09A7\u09C1 \u09A8\u0995\u09B6\u09BE: \u0995\u09CB\u09A8\u09CB \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u09A8\u09C7\u0987, \u09AE\u09BE\u09A8\u0997\u09C1\u09B2\u09CB \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09A8\u09AF\u09BC) |
| `level.veryLow` | very low | খুব কম |
| `level.low` | low | কম |
| `level.middle` | middle | মাঝামাঝি |
| `level.high` | high | বেশি |
| `level.veryHigh` | very high | খুব বেশি |
| `official.framePos` | picture position ${p.x}% across, ${p.y}% up (no map position) | \u099B\u09AC\u09BF\u09B0 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8: \u09AC\u09BE\u0981 \u09A6\u09BF\u0995 \u09A5\u09C7\u0995\u09C7 ${d(p.x)}%, \u09A8\u09BF\u099A \u09A5\u09C7\u0995\u09C7 ${d(p.y)}% (\u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0\u09C7 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8 \u09A8\u09C7\u0987) |
| `official.svs` | SVS ${p.id} | SVS ${int(p.id)} |
| `official.frameTime.count` | ${p.count} ${p.count === 1 ? "frame" : "frames"} | ${int(p.count)}\u099F\u09BF \u09AB\u09CD\u09B0\u09C7\u09AE |
| `official.georef.iou` | Map lines up with coastlines (score ${p.iou}, pass ${p.passAt}) | \u09AE\u09BE\u09A8\u099A\u09BF\u09A4\u09CD\u09B0 \u0989\u09AA\u0995\u09C2\u09B2\u09B0\u09C7\u0996\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09C7\u09B2\u09C7 (\u09B8\u09CD\u0995\u09CB\u09B0 ${d(p.iou)}, \u09AA\u09BE\u09B8\u09C7\u09B0 \u09B8\u09C0\u09AE\u09BE ${d(p.passAt)}) |
| `official.voiceSource` | Voice from ${p.label} (${p.badge}), ${p.period} | \u0995\u09A3\u09CD\u09A0\u09C7\u09B0 \u0989\u09CE\u09B8 ${p.label} (${p.badge}), ${p.period} |
| `official.check.pass` | pass | পাস |
| `official.check.miss` | missed the provisional threshold | অস্থায়ী সীমা পার হয়নি |
| `official.check.none` | no threshold | কোনো সীমা নেই |
| `official.size` | ${formatFixed(p.mb, "en", 1)} MB of data | ${formatFixed(p.mb, "bn", 1)} \u09AE\u09C7\u0997\u09BE\u09AC\u09BE\u0987\u099F \u09A4\u09A5\u09CD\u09AF |
| `braille.instructions` | The shape line holds the data as braille cells. Move its caret, or press a routing key, to move the needle: the sound and the value line follow. R reviews the value in words. Escape closes. | আকার-লাইনে তথ্যগুলো ব্রেইল সেল হিসেবে থাকে। এর ক্যারেট সরান, বা রাউটিং কী চাপুন, সুই সরে যাবে: শব্দ আর মান-লাইন সাথে সাথে বদলায়। R চাপলে মানটি কথায় শোনা যায়। Escape চাপলে বন্ধ হয়। |
| `braille.previewNote` | Preview: your screen reader's braille table may differ. | পূর্বরূপ: আপনার স্ক্রিন রিডারের ব্রেইল টেবিল আলাদা হতে পারে। |
| `braille.noData` | no data | তথ্য নেই |
| `braille.dry` | dry | শুকনো |
| `braille.snow` | snow | তুষার |
| `braille.atOrBelow` | at or below ${p.value} | ${p.value} \u09AC\u09BE \u09A4\u09BE\u09B0 \u09A8\u09BF\u099A\u09C7 |
| `braille.name.ocean` | Sea surface temperature | সমুদ্রপৃষ্ঠের তাপমাত্রা |
| `braille.name.rain` | Rain | বৃষ্টি |
| `braille.words.mmh` | millimetres per hour | মিলিমিটার প্রতি ঘণ্টা |
| `braille.words.degC` | degrees C | ডিগ্রি সেলসিয়াস |
| `braille.words.observation` | observation | পর্যবেক্ষণ |
| `braille.frame` | x${p.x} y${p.y} | x${d(p.x)} y${d(p.y)} |
| `braille.txt.note` | Plain text, wrapped at your display width, for a braille note-taker. | সাধারণ লেখা, আপনার ডিসপ্লের প্রস্থে ভাঙা, ব্রেইল নোট-টেকারের জন্য। |
| `field.veg.summary` | Vegetation index (NDVI) at ${p.place}, ${p.then} against ${p.now} (${p.dataset}). | ${p.place}-\u098F \u0989\u09A6\u09CD\u09AD\u09BF\u09A6 \u09B8\u09C2\u099A\u0995 (NDVI), ${p.then} \u09AC\u09A8\u09BE\u09AE ${p.now} (${p.dataset})\u0964 |

## 6. Data-file sentences and rule words

In `src/lib/i18n/bn/data.ts` (marked "Drafts, review first") and `src/lib/i18n/bn/rules.ts`: the sentences from mapping.json's newer voices (the normal tone, clarity, proof in unison, water's legend, the stale hiss), the units "°C vs normal" and "hours since a 1 km infrared look", the word for echo length (প্রতিধ্বনির দৈর্ঘ্য), and the Bangla "same rule as" sentence for proof in unison.
