# Bangla drafts for review

Every Bangla string drafted in the final pass, in Pratik's priority order: controls, announcements, errors, headings, then the rest. Each row says which session drafted it (A: the interface, Official records, braille, the truth checks; B: the Turntable, its scenes and the source badges). Rows marked **review first** are Pratik's seven and come first in their group. Every string already shows in Bangla mode; all are drafts until a translator has checked them.

Terms follow `docs/i18n/GLOSSARY.md`: Play বাজান; Pause বিরতি দিন; Stop থামান; Close বন্ধ করুন; amber কমলা; needle সুই; record রেকর্ড; frame ফ্রেম; voice কণ্ঠ (under review: in the Mixer it means a sound layer); scene দৃশ্য. Names, organisations, dataset titles and record titles stay as in English. `{name}` is a value the app fills in; `{name: a / b}` means one of those words is used.

Combined by Session A on 2026-11-10 from `docs/i18n/A-BN-REVIEW.md` and `docs/i18n/B-BN-REVIEW.md`, which are generated from the tables.

## 1. Controls (149)

| Key | English | Bangla draft | Drafted by |
|---|---|---|---|
| `braille.bl.braille` | Braille | ব্রেইল | A |
| `braille.bl.flip` | {back: Front / Back} {record} | {back: সামনে / পেছনে} {record} | A |
| `braille.bl.keys` | Keys | কী | A |
| `braille.bl.map` | map | মানচিত্র | A |
| `braille.bl.pause` | Pause | বিরতি দিন | A |
| `braille.bl.play` | Play | বাজান | A |
| `braille.bl.record` | {record} {playing: playing / live} | {record} {playing: বাজছে / লাইভ} | A |
| `braille.bl.save` | Save txt | txt রাখুন | A |
| `braille.bl.scene` | 3D {scene} | থ্রিডি {scene} | A |
| `braille.bl.shape` | shape | আকার | A |
| `braille.bl.soundOn` | Sound on | শব্দ চালু | A |
| `braille.bl.speak` | Speak | বলুন | A |
| `braille.bl.stop` | Stop | থামান | A |
| `braille.bl.storm` | Storm | ঝড় | A |
| `braille.bl.sweep` | Sweep | সুইপ | A |
| `braille.channel` | Data | তথ্য | A |
| `braille.close` | Close braille explorer | ব্রেইল এক্সপ্লোরার বন্ধ করুন | A |
| `braille.degree` | Temperature unit in braille | ব্রেইলে তাপমাত্রার একক | A |
| `braille.degree.hint` | deg C reads more reliably on many displays. | অনেক ডিসপ্লেতে deg C বেশি নির্ভরযোগ্যভাবে পড়া যায়। | A |
| `braille.degree.symbol` | °C | °সে | A |
| `braille.degree.word` | deg C | ডিগ্রি সে. | A |
| `braille.field` | Shape line field | আকার-লাইনের ঘর | A |
| `braille.field.hint` | Some braille displays work better with a single line. | কিছু ব্রেইল ডিসপ্লেতে এক লাইনই ভালো কাজ করে। | A |
| `braille.field.input` | Single line | এক লাইন | A |
| `braille.field.textarea` | Multi-line | একাধিক লাইন | A |
| `braille.howTo` | How to use | কীভাবে ব্যবহার করবেন | A |
| `braille.instructions.short` | Move the caret or press a routing key to move the needle. R reads the value. | সুই সরাতে ক্যারেট সরান বা রাউটিং কী চাপুন। R চাপলে মানটি শোনা যায়। | A |
| `braille.mode` | Shape | আকার | A |
| `braille.mode.grid` | 3 by 3 around the needle | সুইয়ের চারপাশে ৩ × ৩ | A |
| `braille.mode.path` | Along the latitude | অক্ষাংশ বরাবর | A |
| `braille.mode.time` | Through time | সময়ের সাথে | A |
| `braille.off` | Off | বন্ধ | A |
| `braille.on` | On | চালু | A |
| `braille.open` | Braille explorer | ব্রেইল এক্সপ্লোরার | A |
| `braille.preview` | Show braille dots | ব্রেইল বিন্দু দেখান | A |
| `braille.preview.hint` | Large visible dots, for sighted helpers. | বড় দৃশ্যমান বিন্দু, দেখতে পান এমন সহায়কদের জন্য। | A |
| `braille.previewNote` | Preview: your screen reader's braille table may differ. | পূর্বরূপ: আপনার স্ক্রিন রিডারের ব্রেইল টেবিল আলাদা হতে পারে। | A |
| `braille.review` | Review value (R) | মান কথায় শুনুন (R) | A |
| `braille.settings` | Display settings | প্রদর্শনের সেটিংস | A |
| `braille.txt.download` | Download .txt | .txt ডাউনলোড করুন | A |
| `braille.txt.show` | Braille-friendly text | ব্রেইল-বান্ধব লেখা | A |
| `braille.width` | Braille display width (cells) | ব্রেইল ডিসপ্লের প্রস্থ (সেল) | A |
| `key.b.action` | Braille data explorer: feel the data as braille cells; its caret is the needle | ব্রেইল ডেটা এক্সপ্লোরার: তথ্যগুলো ব্রেইল সেল হিসেবে অনুভব করুন; এর ক্যারেট হলো সুই | A |
| `key.r.action` | In the braille explorer: review the value in words | ব্রেইল এক্সপ্লোরারে: মানটি কথায় শুনুন | A |
| `key.u.action` | Proof in unison: hear the nearest checked point (EIC frame tone, then NASA's file tone) | একসুরে প্রমাণ: সবচেয়ে কাছের যাচাই করা বিন্দুটি শুনুন (আগে EIC ফ্রেমের সুর, তারপর নাসার ফাইলের সুর) | A |
| `mode.official` | Official | অফিশিয়াল | A |
| `official.details` | Details | বিস্তারিত | A |
| `official.layer` | Layer | স্তর | A |
| `official.pause` | Pause | বিরতি দিন | A |
| `official.play` | Play | বাজান | A |
| `official.speak` | Speak value | মান শুনুন | A |
| `official.tab.controls` | Controls | নিয়ন্ত্রণ | A |
| `official.tab.source` | Where it's from | কোথা থেকে এসেছে | A |
| `official.time` | Time step | সময়ের ধাপ | A |
| `official.view` | Area | এলাকা | A |
| `official.view.box` | Bangladesh (hourly) | বাংলাদেশ (প্রতি ঘণ্টা) | A |
| `official.view.global` | World | পৃথিবী | A |
| `panel.history` | Month by month | মাসে মাসে | A |
| `truth.unison.play` | Hear the nearest checked point | সবচেয়ে কাছের যাচাই করা বিন্দুটি শুনুন | A |
| `key.sc.all` | Every scene | প্রতিটি দৃশ্য | B |
| `key.sc.all.action` | Space: play or pause · [ / ]: slower or faster · I: details · O: layers · H: help · Shift+D: the controls · Esc: back to the turntable | Space: বাজান বা বিরতি দিন · [ / ]: ধীরে বা দ্রুত · I: বিস্তারিত · O: স্তর · H: সাহায্য · Shift+D: নিয়ন্ত্রণ · Esc: টার্নটেবিলে ফিরুন | B (was চালান বা থামান; glossary fix) |
| `key.sc.delta.action` | Arrows or W A S D: move one degree (with Shift: ten) · , / .: month · Shift+, / .: rain frame · Enter: speak · + / −: zoom | তীর বা W A S D: এক ডিগ্রি সরান (Shift দিয়ে দশ) · , / .: মাস · Shift+, / .: বৃষ্টির ফ্রেম · Enter: বলুন · + / −: জুম | B |
| `key.sc.ghost.action` | Arrows: turn one grid cell (with Shift: five) · 1–3: heat, rain or water · Enter: play both windows · /: search · + / −: zoom | তীর: এক গ্রিড ঘর ঘোরান (Shift দিয়ে পাঁচ) · ১–৩: তাপ, বৃষ্টি বা পানি · Enter: দুই সময়কাল বাজান · /: খুঁজুন · + / −: জুম | B |
| `key.sc.terrain.action` | W / S: walk · A / D: step sideways · Left / Right: turn (with Shift: faster) · Enter: speak · G: find the warmest water · N: the temperature or how far from normal · , / .: rain frame · + / −: zoom | W / S: হাঁটুন · A / D: পাশে সরুন · বাম / ডান: ঘুরুন (Shift দিয়ে দ্রুত) · Enter: বলুন · G: সবচেয়ে উষ্ণ পানি খুঁজুন · N: তাপমাত্রা নাকি স্বাভাবিক থেকে কতটা দূরে · , / .: বৃষ্টির ফ্রেম · + / −: জুম | B |
| `key.sc.tunnel.action` | Arrows: next or previous year (with Shift: ten) · 1 / 2: jump to a window · Enter: speak | তীর: পরের বা আগের বছর (Shift দিয়ে দশ) · ১ / ২: একটি সময়কালে যান · Enter: বলুন | B |
| `key.tt.bookmarks.action` | Jump to a bookmarked place | বুকমার্ক করা জায়গায় যান | B |
| `key.tt.details.action` | Show or hide the details of the value under the needle | সুইয়ের নিচের মানের বিস্তারিত দেখান বা লুকান | B |
| `key.tt.dock.action` | Move focus to the controls (D still turns describing on or off) | নিয়ন্ত্রণে ফোকাস নিন (D আগের মতোই বর্ণনা চালু/বন্ধ করে) | B |
| `key.tt.enter.action` | Speak the value, place and frame time under the needle, and show its details | সুইয়ের নিচের মান, জায়গা ও ফ্রেমের সময় শুনুন, বিস্তারিত দেখুন | B |
| `key.tt.esc.action` | Stop a tour or flight, or close search; otherwise stop all sound and go back to the flat map | ট্যুর বা উড়ান থামান, বা সার্চ বন্ধ করুন; না হলে সব শব্দ থামিয়ে সমতল মানচিত্রে ফিরুন | B |
| `key.tt.leftRight` | Left / Right | বাম / ডান | B |
| `key.tt.leftRight.action` | Turn the globe 1 degree (with Shift: 10 degrees); stops the turning | গ্লোব ১ ডিগ্রি ঘোরান (Shift সহ: ১০ ডিগ্রি); ঘোরানো থেমে যায় | B |
| `key.tt.opacity.action` | Data layer opacity (0, 25, 50, 85, 100%) | ডেটা স্তরের অস্বচ্ছতা (০, ২৫, ৫০, ৮৫, ১০০%) | B |
| `key.tt.r.action` | Next / previous record | পরের / আগের রেকর্ড | B |
| `key.tt.search.action` | Search a place (G works too) | জায়গা খুঁজুন (G-ও কাজ করে) | B |
| `key.tt.space.action` | Start or stop the turning | ঘোরানো শুরু বা বন্ধ করুন | B |
| `key.tt.speed.action` | Turn slower / faster | ধীরে / দ্রুত ঘোরান | B |
| `key.tt.tour.action` | Start or stop the tour | ট্যুর শুরু বা বন্ধ করুন | B |
| `key.tt.upDown` | Up / Down | ওপর / নিচ | B |
| `key.tt.upDown.action` | Move the needle 1 degree north or south (with Shift: 10 degrees), up to 80 degrees | সুই ১ ডিগ্রি উত্তরে বা দক্ষিণে সরান (Shift সহ: ১০ ডিগ্রি), ৮০ ডিগ্রি পর্যন্ত | B |
| `key.tt.view.action` | Jukebox view / close-up view | জুকবক্স দৃশ্য / কাছ থেকে দৃশ্য | B |
| `key.tt.where.action` | Where am I? (Shift+L: hear the legend) | আমি কোথায়? (Shift+L: লেজেন্ড শুনুন) | B |
| `key.tt.zoom.action` | Zoom in / out | জুম ইন / আউট | B |
| `scenes.back` | Back to turntable | টার্নটেবিলে ফিরুন | B |
| `scenes.delta.show.districts` | Districts (when close) | জেলা (কাছে গেলে) | B |
| `scenes.delta.show.rivers` | Rivers | নদী | B |
| `scenes.ghost.layer.heat` | Heat | তাপ | B |
| `scenes.ghost.layer.rain` | Rain | বৃষ্টি | B |
| `scenes.ghost.layer.water` | Water | পানি | B |
| `scenes.ghost.record` | Record | রেকর্ড | B |
| `scenes.ghost.show.core` | Blue Marble core | ব্লু মার্বেল কেন্দ্র | B |
| `scenes.ghost.show.ghost` | Then (silver ghost) | তখন (রুপালি ছায়া) | B |
| `scenes.layers.heading` | Show | দেখান | B |
| `scenes.layers.note` | Decoration only: the values and sounds never change. | শুধু সাজসজ্জা: মান ও শব্দ কখনো বদলায় না। | B |
| `scenes.open` | Open the {scene} scene | {scene} দৃশ্য খুলুন | B |
| `scenes.pause` | Pause | বিরতি দিন | B (was থামান; glossary fix) |
| `scenes.play` | Play | বাজান | B (was চালান; glossary fix) |
| `scenes.speed` | {speed}× | {speed}× | B |
| `scenes.tactile` | Export tactile record (STL) | স্পর্শযোগ্য রেকর্ড রপ্তানি (STL) | B |
| `scenes.terrain.goal` | Find the warmest water | উষ্ণতম পানি খুঁজুন | B |
| `scenes.terrain.vsNormal` | Vs normal | স্বাভাবিকের তুলনায় | B |
| `scenes.tunnel.jump` | Jump to {label} | {label}-এ যান | B |
| `scenes.tunnel.speed` | {speed} years/s | {speed} বছর/সেকেন্ড | B |
| `turntable.announce.record` | Record: {record}. {frames} | রেকর্ড: {record}। {frames} | B |
| `turntable.bookmarks` | Bookmarks | বুকমার্ক | B |
| `turntable.creditsLink` | Credits | কৃতজ্ঞতা | B |
| `turntable.details.close` | Close details | বিস্তারিত বন্ধ করুন | B |
| `turntable.details.open` | Details of the value under the needle | সুইয়ের নিচের মানের বিস্তারিত | B |
| `turntable.details.pin` | Keep details open | বিস্তারিত খোলা রাখুন | B |
| `turntable.details.unpin` | Let details close | বিস্তারিত বন্ধ হতে দিন | B |
| `turntable.dock.help` | Keys and help | কী ও সাহায্য | B |
| `turntable.dock.layers` | Layers and sound | স্তর ও শব্দ | B |
| `turntable.dock.settings` | Settings | সেটিংস | B |
| `turntable.dock.speed` | Turning and speed | ঘোরা ও গতি | B |
| `turntable.faster` | Faster | দ্রুত | B |
| `turntable.flatMap` | Flat map | সমতল মানচিত্র | B |
| `turntable.layers.borders` | Borders | সীমানা | B |
| `turntable.layers.decoration` | Background and map layers | পটভূমি ও মানচিত্রের স্তর | B |
| `turntable.layers.districts` | Districts | জেলা | B |
| `turntable.layers.labels` | Place names | স্থানের নাম | B |
| `turntable.layers.note` | Borders and names are decoration. The data layer, values and sound don't change. | সীমানা ও নাম কেবল সাজ। ডেটা স্তর, মান ও শব্দ বদলায় না। | B |
| `turntable.layers.rivers` | Rivers | নদী | B |
| `turntable.layers.sound` | Sound mixer | শব্দ মিশ্রণ | B |
| `turntable.more.back` | Back | ফিরে যান | B |
| `turntable.myLocation` | My location | আমার অবস্থান | B |
| `turntable.opacity` | Data layer | ডেটা স্তর | B |
| `turntable.panels.hide` | Hide panels | প্যানেল লুকান | B |
| `turntable.panels.show` | Show panels | প্যানেল দেখান | B |
| `turntable.quality` | Quality | ছবির মান | B |
| `turntable.quality.auto` | Auto | স্বয়ংক্রিয় | B |
| `turntable.quality.high` | High | উচ্চ | B |
| `turntable.quality.low` | Low | নিম্ন | B |
| `turntable.quality.ultra` | Ultra | সর্বোচ্চ | B |
| `turntable.records` | Records | রেকর্ড | B |
| `turntable.search.label` | Search places | জায়গা খুঁজুন | B |
| `turntable.search.short` | Search | খুঁজুন | B |
| `turntable.sleeve.flip` | Show the {record} cover | {record} রেকর্ডের প্রচ্ছদ দেখান | B |
| `turntable.sleeve.play` | Play the {record} record | {record} রেকর্ড বাজান | B |
| `turntable.slower` | Slower | ধীরে | B |
| `turntable.sources` | Sources and checks | উৎস ও যাচাই | B |
| `turntable.speed` | Speed {speed}× | গতি {speed}× | B |
| `turntable.stopTurning` | Stop turning | ঘোরানো থামান | B |
| `turntable.tour.start` | Tour | ট্যুর | B |
| `turntable.tour.stop` | Stop tour | ট্যুর থামান | B |
| `turntable.turn` | Turn | ঘোরান | B |
| `turntable.view.explore` | Close-up view | কাছ থেকে দৃশ্য | B |
| `turntable.view.jukebox` | Jukebox view | জুকবক্স দৃশ্য | B |
| `turntable.view.label` | View | দৃশ্য | B |
| `turntable.where.button` | Where am I? | আমি কোথায়? | B |

## 2. Announcements (28)

| Key | English | Bangla draft | Drafted by |
|---|---|---|---|
| `caption.earcon.needleDrop` **review first** | Needle drop: a new record | সুই নামল: নতুন রেকর্ড | B |
| `turntable.stopped` **review first** | Stopped. Back to the flat map. | থেমেছে। সমতল মানচিত্রে ফেরা হলো। | B |
| `braille.loading` | Loading the shape | আকার লোড হচ্ছে | A |
| `braille.modeAnnounce` | Shape: {mode} | আকার: {mode} | A |
| `braille.reviewLine` | {name} {value} at {place}{time}, {badge}{status} | {name} {value}, {place}{time}, {badge}{status} | A |
| `braille.reviewOff` | Review off | কথায় শোনা বন্ধ | A |
| `braille.reviewOn` | Review on | কথায় শোনা চালু | A |
| `caption.unison` | Proof in unison: frame {…} °C, NASA file {…} °C, … {…} beats a second | একসুরে প্রমাণ: ফ্রেম {…} °সে, নাসার ফাইল {…} °সে, … সেকেন্ডে {…}টি বিট | A |
| `caption.water.gapTexture` | Soft ticks: no satellite measurement for {…} … Soft ticks: no satellite measurements, {…} to {…} | নরম টিক: {…}-এ কোনো স্যাটেলাইট পরিমাপ নেই … নরম টিক: {…} থেকে {…} পর্যন্ত কোনো স্যাটেলাইট পরিমাপ নেই | A |
| `official.loading` | Loading the records | রেকর্ডগুলো লোড হচ্ছে | A |
| `official.map` | {layer}, {time}. Under the needle: {reading}. Arrow keys move the needle. | {layer}, {time}। সুইয়ের নিচে: {reading}। তীর-কী দিয়ে সুই সরান। | A |
| `official.related.loading` | Loading the related records | সম্পর্কিত রেকর্ডগুলো লোড হচ্ছে | A |
| `unison.loading` | The checked points are still loading. | যাচাই করা বিন্দুগুলো এখনো লোড হচ্ছে। | A |
| `unison.say` | Nearest checked point, {km} km away, {place}. Frame {frame} degrees, NASA file {file} degrees. The frame tone first, then the file tone joins. | সবচেয়ে কাছের যাচাই করা বিন্দু, {km} কিলোমিটার দূরে, {place}। ফ্রেম {frame} ডিগ্রি, … নাসার ফাইল {file} ডিগ্রি। আগে ফ্রেমের সুর, তারপর ফাইলের সুর যোগ হয়। | A |
| `scenes.delta.say` | {month}. {bd}. {nw}. {rain}. | {month}। {bd}। {nw}। {rain}। | B |
| `scenes.ghost.say` | {where}. {a}: {then} {unit}. {b}: {now} {unit}. Change {change}. | {where}। {a}: {then} {unit}। {b}: {now} {unit}। পরিবর্তন {change}। | B |
| `scenes.ghost.sayHollow` | {where}. No data in one of the windows here. | {where}। এখানে একটি সময়কালে ডেটা নেই। | B |
| `scenes.terrain.found` | Found it: {value} °C at {lat}, {lon}, the warmest water in this region in today's frame. | পেয়েছেন: {lat}, {lon}-এ {value} °সে, আজকের ফ্রেমে এই অঞ্চলের উষ্ণতম পানি। | B |
| `scenes.terrain.say` | {value} degrees at {lat}, {lon}. | {lat}, {lon}-এ {value} ডিগ্রি। | B |
| `scenes.terrain.sayAnomaly` | {value} degrees from normal at {lat}, {lon}. | {lat}, {lon}-এ স্বাভাবিক থেকে {value} ডিগ্রি। | B |
| `scenes.terrain.sayLand` | Land at {lat}, {lon}: silent. | {lat}, {lon}-এ স্থল: নীরব। | B |
| `scenes.tunnel.end` | End of the record: back to the turntable. | রেকর্ড শেষ: টার্নটেবিলে ফেরা। | B |
| `scenes.tunnel.say` | {year}. {heat}. {rain}. | {year}। {heat}। {rain}। | B |
| `turntable.announce.frame` | {product}, latest available frame {datetime} UTC. | {product}, সর্বশেষ প্রাপ্ত ফ্রেম {datetime} UTC। | B |
| `turntable.announce.stoppedTurning` | Turning stopped | ঘোরানো থেমেছে | B |
| `turntable.announce.turning` | Turning | ঘুরছে | B |
| `turntable.announce.view` | {view}. | {view}। | B |
| `turntable.frameTime` | Frame: {datetime} UTC | ফ্রেম: {datetime} UTC | B |

## 3. Errors and missing data (15)

| Key | English | Bangla draft | Drafted by |
|---|---|---|---|
| `turntable.error.ocean` **review first** | (template) median {n} °C against NASA MUR ({n} points, latest frame) | (template) মধ্যমা {n} °সে, NASA MUR-এর তুলনায় ({n}টি বিন্দু, সর্বশেষ ফ্রেম) | B |
| `turntable.error.rain` **review first** | (template) typically within ~{n}% | (template) সাধারণত ~{n}%-এর মধ্যে | B |
| `official.error` | Couldn't load the official records. Reload the page to try again. | অফিশিয়াল রেকর্ডগুলো লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন। | A |
| `official.related.error` | Couldn't load the related records. | সম্পর্কিত রেকর্ডগুলো লোড করা যায়নি। | A |
| `truth.anomaly.error` | Couldn't load the anomaly check. Reload the page to try again. | অস্বাভাবিকতার যাচাই লোড করা যায়নি। আবার চেষ্টা করতে পাতাটি রিলোড করুন। | A |
| `scenes.delta.noRain` | Rain here: no data | এখানে বৃষ্টি: ডেটা নেই | B |
| `scenes.failed` | Couldn't load this scene's records. Esc goes back to the turntable. | এই দৃশ্যের রেকর্ড লোড করা যায়নি। Esc চাপলে টার্নটেবিলে ফিরবেন। | B |
| `scenes.ghost.hollow` | No data in a window here (hollow) | এখানে কোনো এক সময়কালে ডেটা নেই (ফাঁপা) | B |
| `scenes.missing` | none | নেই | B |
| `scenes.terrain.clarityNone` | No clear 1 km look in MUR's window: the longest echo | MUR-এর সময়সীমায় কোনো পরিষ্কার ১ কিমি পর্যবেক্ষণ নেই: সবচেয়ে লম্বা প্রতিধ্বনি | B |
| `scenes.tunnel.noRain` | No GPCP months this year | এ বছর GPCP-র কোনো মাস নেই | B |
| `turntable.error` | Measured error: {text} | পরিমাপিত ত্রুটি: {text} | B |
| `turntable.missing` | none | নেই | B |
| `turntable.myLocation.denied` | Location wasn't shared. Nothing was stored. | অবস্থান শেয়ার করা হয়নি। কিছুই সংরক্ষণ করা হয়নি। | B |
| `turntable.myLocation.unsupported` | This browser can't share a location. | এই ব্রাউজার অবস্থান শেয়ার করতে পারে না। | B |

## 4. Headings and names (47)

| Key | English | Bangla draft | Drafted by |
|---|---|---|---|
| `braille.heading` | Braille data explorer | ব্রেইল ডেটা এক্সপ্লোরার | A |
| `braille.relativeScale` | Relative shape, scale | আপেক্ষিক আকার, স্কেল | A |
| `braille.scale` | Scale | স্কেল | A |
| `braille.shapeLine` | Shape line | আকার-লাইন | A |
| `braille.shapeRole` | braille shape | ব্রেইল আকার | A |
| `braille.txt.heading` | Braille-friendly text | ব্রেইল-বান্ধব লেখা | A |
| `braille.valueLine` | Value line | মান-লাইন | A |
| `credits.products` | Data in this app | এই অ্যাপের তথ্য | A |
| `official.checks` | Checks | যাচাই | A |
| `official.credits` | Credits | কৃতজ্ঞতা | A |
| `official.description` | From the SVS page | SVS পাতা থেকে | A |
| `official.frameTime` | Frame times | ফ্রেমের সময় | A |
| `official.georef` | Map position | মানচিত্রে অবস্থান | A |
| `official.heading` | NASA's Challenge resources, as data | নাসার চ্যালেঞ্জের উপকরণ, তথ্য হিসেবে | A |
| `official.licence` | Licence | লাইসেন্স | A |
| `official.period` | Period | সময়কাল | A |
| `official.provenance` | Where this comes from | এটি কোথা থেকে এসেছে | A |
| `official.records` | Records | রেকর্ড | A |
| `official.related.heading` | Related NASA visualizations | সম্পর্কিত নাসা ভিজ্যুয়ালাইজেশন | A |
| `truth.anomaly.heading` | Ocean temperature vs normal | স্বাভাবিকের তুলনায় সমুদ্রের তাপমাত্রা | A |
| `truth.threeway.heading` | Three readings of the same points | একই বিন্দুর তিনটি পাঠ | A |
| `truth.unison.heading` | Proof in unison | একসুরে প্রমাণ | A |
| `help.scenes` | In the 3D scenes | ত্রিমাত্রিক দৃশ্যে | B |
| `help.turntable` | On the turntable | টার্নটেবিলে | B |
| `mode.turntable` | Turntable | টার্নটেবিল | B |
| `scenes.delta.canvas` | Bangladesh in relief with its two big rivers. Below it, a cut-away block of ground water rises and falls with the GRACE record; NW India's block stands beside it on the same scale. | উঁচু-নিচু বাংলাদেশ ও তার দুটি বড় নদী। নিচে কাটা অংশে ভূগর্ভস্থ পানির স্তর GRACE রেকর্ড অনুযায়ী ওঠানামা করে; পাশে একই মাপে উত্তর-পশ্চিম ভারতের স্তর। | B |
| `scenes.delta.how` | Arrows or W A S D move the needle over the delta; drag to orbit. Enter speaks the values here. Space plays both water tables on one scale, Bangladesh first. Comma and full stop step the month; Shift with them steps the rain frame. | তীরচিহ্ন বা W A S D দিয়ে সুই সরান; টেনে ঘোরান। Enter এখানকার মান বলে। স্পেস একই মাপে দুটি পানির স্তর বাজায়, আগে বাংলাদেশ। কমা ও দাঁড়ি মাস বদলায়; Shift সহ বৃষ্টির ফ্রেম বদলায়। | B |
| `scenes.delta.sleeve` | Delta + aquifer | ব-দ্বীপ + ভূগর্ভস্থ পানি | B |
| `scenes.delta.title` | The playable delta: water underground | বাজানো যায় এমন ব-দ্বীপ: মাটির নিচের পানি | B |
| `scenes.ghost.canvas` | Two globes over each other: the earlier window as a silver ghost and the recent window as a solid shell, raised or lowered by the change and coloured by it. | দুটি গ্লোব একটির ওপর আরেকটি: আগের সময়কাল রুপালি ছায়া, সাম্প্রতিক সময়কাল নিরেট খোলস, পরিবর্তন অনুযায়ী উঁচু-নিচু ও রঙিন। | B |
| `scenes.ghost.how` | Drag or use the arrows to turn the globe (one arrow is one grid cell). Enter plays then, then now, and speaks both. 1, 2 and 3 choose heat, rain or water. Slash searches places. | টেনে বা তীরচিহ্ন দিয়ে গ্লোব ঘোরান (একবার চাপ = একটি গ্রিড ঘর)। Enter আগে তখন, পরে এখন বাজায় ও দুটি মানই বলে। ১, ২, ৩: তাপ, বৃষ্টি, পানি। স্ল্যাশ দিয়ে জায়গা খুঁজুন। | B |
| `scenes.ghost.sleeve` | Ghost Earths | ভূতুড়ে পৃথিবী | B |
| `scenes.ghost.title` | Ghost Earths: then vs now | ভূতুড়ে পৃথিবী: তখন বনাম এখন | B |
| `scenes.heading` | Scenes | দৃশ্য | B |
| `scenes.terrain.canvas` | The Bay of Bengal as a landscape: higher ground is warmer water, coloured by NASA's own map. Rain from the last 24 hours drifts over it. | বঙ্গোপসাগর এক ভূদৃশ্য: উঁচু মানে উষ্ণ পানি, NASA-র নিজের মানচিত্রের রঙে। গত ২৪ ঘণ্টার বৃষ্টি এর ওপর দিয়ে ভেসে যায়। | B |
| `scenes.terrain.how` | Arrows or W A S D walk (Shift: faster); drag to look around. Under your feet you hear the sea temperature on a zoomed axis. Enter speaks it. G starts the warmest-water hunt. | তীরচিহ্ন বা W A S D দিয়ে হাঁটুন (Shift: দ্রুত); টেনে চারপাশ দেখুন। পায়ের নিচে সাগরের তাপমাত্রা শোনেন জুম করা অক্ষে। Enter মান বলে। G উষ্ণতম পানির খোঁজ শুরু করে। | B |
| `scenes.terrain.sleeve` | Sound terrain | শব্দের ভূখণ্ড | B |
| `scenes.terrain.title` | Sound terrain: Bay of Bengal | শব্দের ভূখণ্ড: বঙ্গোপসাগর | B |
| `scenes.tunnel.canvas` | A tunnel of rings, one per year. Each ring's colour is that year's April–May heat anomaly; its twelve beads are the months' rain. | বছরপ্রতি একটি করে বলয়ের সুড়ঙ্গ। প্রতিটি বলয়ের রং সেই বছরের এপ্রিল–মে তাপের অস্বাভাবিকতা; বারোটি পুঁতি মাসগুলোর বৃষ্টি। | B |
| `scenes.tunnel.how` | Space flies through the years; [ and ] change speed; left and right step one year; 1 and 2 jump to the two windows. Enter speaks the year. | স্পেস বছরগুলোর মধ্য দিয়ে ওড়ায়; [ ও ] গতি বদলায়; বাম ও ডান এক বছর সরায়; ১ ও ২ দুটি সময়কালে যায়। Enter বছরটি বলে। | B |
| `scenes.tunnel.sleeve` | Dhaka time tunnel | ঢাকা সময়-সুড়ঙ্গ | B |
| `scenes.tunnel.title` | Dhaka time tunnel | ঢাকা সময়-সুড়ঙ্গ | B |
| `turntable.canvas` | A globe on a turntable with the latest available {record} frame over it. A tonearm's needle reads the point beneath it. | টার্নটেবিলে একটি গ্লোব, তার ওপর সর্বশেষ প্রাপ্ত {record} ফ্রেম। টোনআর্মের সুই নিচের বিন্দুটি পড়ে। | B |
| `turntable.instructions` | Arrows turn the globe and move the needle (Shift: 10 degrees). Enter speaks the value. Slash searches places, L says where you are, 1 to 9 jump to bookmarks, T starts a tour, plus and minus zoom, V switches the view. H lists all keys. Esc goes back to the flat map. | তীর চিহ্নের কী দিয়ে গ্লোব ঘোরান ও সুই সরান (Shift সহ: ১০ ডিগ্রি)। Enter চাপলে মান বলা হবে। স্ল্যাশ (/) দিয়ে জায়গা খুঁজুন, L চাপলে আপনি কোথায় আছেন জানাবে, ১ থেকে ৯ বুকমার্কে যায়, T দিয়ে ট্যুর শুরু, প্লাস ও মাইনাস দিয়ে জুম, V দিয়ে দৃশ্য বদলান। সব কী দেখতে H চাপুন। Esc চাপলে সমতল মানচিত্রে ফিরবেন। | B |
| `turntable.preview` | Preview | পূর্বরূপ | B |
| `turntable.region` | Turntable Earth, playing the {record} record | টার্নটেবিল আর্থ, {record} রেকর্ড বাজছে | B |
| `turntable.roleDescription` | turntable | টার্নটেবিল | B |

## 5. The rest (186)

| Key | English | Bangla draft | Drafted by |
|---|---|---|---|
| `scenes.ghost.honesty` **review first** | Heat: GISTEMP land cells only. GRACE ~3° resolution. Monthly records, multi-year windows. | তাপ: শুধু GISTEMP-এর স্থলভাগের ঘর। GRACE-এর রেজোলিউশন প্রায় ৩°। মাসিক রেকর্ড, বহু বছরের সময়সীমা। | B |
| `scenes.tunnel.credit` **review first** | Pitch-per-year idea after Daniel Crawford (2013). | প্রতি বছরের জন্য একটি সুরের উচ্চতার ধারণা, Daniel Crawford (২০১৩)-এর অনুসরণে। | B |
| `turntable.credits` **review first** | 3D scenes: NASA Earth Observatory, Blue Marble Next Generation, September (Reto Stöckli) · Topography: NASA Earth Observatory (Jesse Allen), GEBCO data from the British Oceanographic Data Centre · Studio light: Poly Haven studio_small_09 (CC0) · Borders, places, rivers, seas: Natural Earth (public domain) · Districts: geoBoundaries (CC BY 3.0 IGO; source BBS, OCHA ROAP) · Data frames: NASA SVS 5101 / 4285 for the NASA Earth Information Center | ত্রিমাত্রিক দৃশ্য: NASA Earth Observatory, Blue Marble Next Generation, September (Reto Stöckli) · ভূসংস্থান: NASA Earth Observatory (Jesse Allen), British Oceanographic Data Centre-এর GEBCO ডেটা · স্টুডিওর আলো: Poly Haven studio_small_09 (CC0) · সীমানা, স্থান, নদী, সমুদ্র: Natural Earth (পাবলিক ডোমেইন) · জেলা: geoBoundaries (CC BY 3.0 IGO; উৎস BBS, OCHA ROAP) · ডেটা ফ্রেম: NASA Earth Information Center-এর জন্য NASA SVS 5101 / 4285 | B |
| `braille.atOrBelow` | at or below {value} | {value} বা তার নিচে | A |
| `braille.dry` | dry | শুকনো | A |
| `braille.frame` | x{x} y{y} | x{x} y{y} | A |
| `braille.instructions` | The shape line holds the data as braille cells. Move its caret, or press a routing key, to move the needle: the sound and the value line follow. R reviews the value in words. Escape closes. | আকার-লাইনে তথ্যগুলো ব্রেইল সেল হিসেবে থাকে। এর ক্যারেট সরান, বা রাউটিং কী চাপুন, সুই সরে যাবে: শব্দ আর মান-লাইন সাথে সাথে বদলায়। R চাপলে মানটি কথায় শোনা যায়। Escape চাপলে বন্ধ হয়। | A |
| `braille.name.ocean` | Sea surface temperature | সমুদ্রপৃষ্ঠের তাপমাত্রা | A |
| `braille.name.rain` | Rain | বৃষ্টি | A |
| `braille.noData` | no data | তথ্য নেই | A |
| `braille.snow` | snow | তুষার | A |
| `braille.txt.note` | Plain text, wrapped at your display width, for a braille note-taker. | সাধারণ লেখা, আপনার ডিসপ্লের প্রস্থে ভাঙা, ব্রেইল নোট-টেকারের জন্য। | A |
| `braille.words.degC` | degrees C | ডিগ্রি সেলসিয়াস | A |
| `braille.words.mmh` | millimetres per hour | মিলিমিটার প্রতি ঘণ্টা | A |
| `braille.words.observation` | observation | পর্যবেক্ষণ | A |
| `field.veg.summary` | Vegetation index (NDVI) at {place}, {then} against {now} ({dataset}). | {place}-এ উদ্ভিদ সূচক (NDVI), {then} বনাম {now} ({dataset})। | A |
| `level.high` | high | বেশি | A |
| `level.low` | low | কম | A |
| `level.middle` | middle | মাঝারি | A |
| `level.veryHigh` | very high | খুব বেশি | A |
| `level.veryLow` | very low | খুব কম | A |
| `official.approximate` | approximate time | আনুমানিক সময় | A |
| `official.atLimit` | at or below {value} {unit} (colorbar limit) | {value} {unit} বা তার নিচে (রঙের স্কেলের সীমা) | A |
| `official.below` | below {value} {unit} (colorbar minimum) | {value} {unit}-এর নিচে (রঙের স্কেলের সর্বনিম্ন) | A |
| `official.check.miss` | missed the provisional threshold | অস্থায়ী সীমা পার হয়নি | A |
| `official.check.none` | no threshold | কোনো সীমা নেই | A |
| `official.check.pass` | pass | পাস | A |
| `official.focus.agriculture` | Agriculture | কৃষি | A |
| `official.focus.air quality` | Air quality | বাতাসের মান | A |
| `official.focus.biodiversity` | Biodiversity | জীববৈচিত্র্য | A |
| `official.focus.disasters` | Disasters | দুর্যোগ | A |
| `official.focus.energy` | Energy | শক্তি | A |
| `official.focus.greenhouse gases` | Greenhouse gases | গ্রিনহাউস গ্যাস | A |
| `official.focus.other` | Other | অন্যান্য | A |
| `official.focus.sea level` | Sea level | সমুদ্রপৃষ্ঠের উচ্চতা | A |
| `official.focus.water resources` | Water resources | পানিসম্পদ | A |
| `official.focus.wildfires` | Wildfires | দাবানল | A |
| `official.framePos` | picture position {x}% across, {y}% up (no map position) | ছবির অবস্থান: বাঁ দিক থেকে {x}%, নিচ থেকে {y}% (মানচিত্রে অবস্থান নেই) | A |
| `official.frameTime.count` | {count} {count: frame / frames} | {count}টি ফ্রেম | A |
| `official.georef.iou` | Map lines up with coastlines (score {iou}, pass {passAt}) | মানচিত্র উপকূলরেখার সাথে মেলে (স্কোর {iou}, পাসের সীমা {passAt}) | A |
| `official.intro` | Each record is one official SVS visualization, read back into values. Plain sound only: one voice per record. | প্রতিটি রেকর্ড নাসার একটি অফিশিয়াল SVS ভিজ্যুয়ালাইজেশন, যা থেকে আবার মান পড়া হয়েছে। শুধু সাদামাটা শব্দ: প্রতি রেকর্ডে একটি কণ্ঠ। | A |
| `official.noValue` | No value here | এখানে কোনো মান নেই | A |
| `official.pattern` | {level} (pattern only: no number, the values are not verified) | {level} (শুধু নকশা: কোনো সংখ্যা নেই, মানগুলো যাচাই করা নয়) | A |
| `official.related.beside` | beside SVS {ids} | SVS {ids}-এর পাশে | A |
| `official.related.intro` | Items NASA may add: each sits beside the official record it relates to, grouped by EIC focus area, with the same provenance and checks. | যেসব জিনিস নাসা যোগ করতে পারে: প্রতিটি থাকে যে অফিশিয়াল রেকর্ডের সাথে সম্পর্কিত তার পাশে, EIC-এর বিষয় অনুযায়ী সাজানো, একই উৎস-তথ্য ও যাচাইসহ। | A |
| `official.size` | {mb} MB of data | {mb} মেগাবাইট তথ্য | A |
| `official.svs` | SVS {id} | SVS {id} | A |
| `official.timeValue` | {time} (step {step} of {total}) | {time} ({total}টির মধ্যে {step} নম্বর ধাপ) | A |
| `official.value` | {value} {unit} | {value} {unit} | A |
| `official.voiceSource` | Voice from {label} ({badge}), {period} | কণ্ঠের উৎস {label} ({badge}), {period} | A |
| `truth.anomaly.sentence` | SST anomaly checked against NOAA Coral Reef Watch: same sign at {signPct}% of {n} points; reads {offset} °C {offset: cooler / warmer} (different baselines). | NOAA Coral Reef Watch-এর সাথে মিলিয়ে দেখা সমুদ্রপৃষ্ঠের তাপমাত্রার অস্বাভাবিকতা: {n}টি বিন্দুর {signPct}%-এ একই দিক; … {offset} °সে {offset: বেশি শীতল / বেশি উষ্ণ} দেখায় (ভিত্তিকাল আলাদা)। | A |
| `truth.threeway.sentence` | At {n} points, NASA's GIBS map layer and the MUR file differ by a median of {gibs} °C; … the EIC picture and the MUR file by {frame} °C. {decodePct}% of GIBS pixels decode to a value. | {n}টি বিন্দুতে নাসার GIBS মানচিত্র-স্তর ও MUR ফাইলের মধ্যমা পার্থক্য {gibs} °সে; … EIC ছবি ও MUR ফাইলের {frame} °সে। GIBS-এর {decodePct}% পিক্সেল থেকে মান পড়া যায়। | A |
| `truth.unison.explain` | Two tones: one from the EIC picture, one from NASA's file. Beats mean they disagree. {median} °C ≈ {semitones} of a semitone. | দুটি সুর: একটি EIC ছবি থেকে, একটি নাসার ফাইল থেকে। বিট শোনা গেলে দুটো মেলেনি। {median} °সে ≈ এক সেমিটোনের {semitones} ভাগ। | A |
| `truth.unison.helix` | Proof helix: the frame's strand and the file's strand turn round each other {beats} times a second (they merge when the values agree). | প্রমাণের হেলিক্স: ফ্রেমের সুতো আর ফাইলের সুতো সেকেন্ডে {beats} বার একে অপরকে ঘিরে ঘোরে (মান মিললে দুটো এক হয়ে যায়)। | A |
| `truth.unison.pair` | Frame {frame} °C, NASA file {file} °C: {beats} beats per second. | ফ্রেম {frame} °সে, নাসার ফাইল {file} °সে: সেকেন্ডে {beats}টি বিট। | A |
| `scenes.conf.high` | high | উচ্চ | B |
| `scenes.conf.low` | low | কম | B |
| `scenes.conf.medium` | medium | মাঝারি | B |
| `scenes.conf.satellite-only` | satellite only (no gauges) | শুধু স্যাটেলাইট (মাপক যন্ত্র নেই) | B |
| `scenes.context` | Context layer, not an EIC frame | প্রেক্ষাপট স্তর, EIC ফ্রেম নয় | B |
| `scenes.delta.bd` | Bangladesh | বাংলাদেশ | B |
| `scenes.delta.box` | {name} box: lon {lon0}–{lon1}, lat {lat0}–{lat1} | {name} বাক্স: দ্রাঘিমা {lon0}–{lon1}, অক্ষাংশ {lat0}–{lat1} | B |
| `scenes.delta.dry` | Rain here: dry | এখানে বৃষ্টি: শুকনো | B |
| `scenes.delta.gap` | No satellite measurement this month | এই মাসে স্যাটেলাইট পরিমাপ নেই | B |
| `scenes.delta.month` | GRACE month | GRACE মাস | B |
| `scenes.delta.noMeghna` | The Meghna isn't in the shipped river file, so it isn't drawn. | মেঘনা দেওয়া নদীর ফাইলে নেই, তাই আঁকা হয়নি। | B |
| `scenes.delta.nw` | NW India | উত্তর-পশ্চিম ভারত | B |
| `scenes.delta.outside` | Outside the {name} box | {name} বাক্সের বাইরে | B |
| `scenes.delta.rainHere` | Rain here: {value} mm/h | এখানে বৃষ্টি: {value} মিমি/ঘণ্টা | B |
| `scenes.delta.resolution` | GRACE {text} | GRACE {text} | B |
| `scenes.delta.river` | {name}. River heights: coming (SWOT) | {name}। নদীর উচ্চতা: আসছে (SWOT) | B |
| `scenes.delta.river.Brahmaputra` | Brahmaputra (Jamuna) | ব্রহ্মপুত্র (যমুনা) | B |
| `scenes.delta.river.Ganges` | Ganges (Padma) | গঙ্গা (পদ্মা) | B |
| `scenes.delta.scale` | Both water tables on one fixed scale, {min} to {max} cm (the water voice's range) | দুটি পানির স্তর একই নির্দিষ্ট মাপে, {min} থেকে {max} সেমি (পানির কণ্ঠের সীমা) | B |
| `scenes.delta.semitones` | On the shared scale the window means fall {bd} semitones in Bangladesh and {nw} in NW India ({ratio}×). | একই মাপে সময়কালের গড় বাংলাদেশে {bd} সেমিটোন ও উত্তর-পশ্চিম ভারতে {nw} সেমিটোন নামে ({ratio}×)। | B |
| `scenes.delta.water` | {name}: {value} cm | {name}: {value} সেমি | B |
| `scenes.delta.waterLegend` | Water table on the shared scale (cm) | একই মাপে পানির স্তর (সেমি) | B |
| `scenes.entry` | {scene}. {how} | {scene}। {how} | B |
| `scenes.exaggerated` | Height: {text} (exaggerated) | উচ্চতা: {text} (বাড়িয়ে দেখানো) | B |
| `scenes.framePaired` | Frame-paired: the EIC SST frame of {datetime} UTC | ফ্রেম-যুক্ত: {datetime} UTC-র EIC SST ফ্রেম | B |
| `scenes.ghost.cell` | Grid cell centred {lat}, {lon} | গ্রিড ঘরের কেন্দ্র {lat}, {lon} | B |
| `scenes.ghost.change` | Change {change} {unit} | পরিবর্তন {change} {unit} | B |
| `scenes.ghost.confidence` | GPCP–GPCC agreement: {level} | GPCP–GPCC মিল: {level} | B |
| `scenes.ghost.legend` | Change, {b} minus {a} ({unit}) | পরিবর্তন, {b} বিয়োগ {a} ({unit}) | B |
| `scenes.ghost.monthly` | Plays every month of each window; missing months tick softly. | প্রতিটি সময়কালের প্রতিটি মাস বাজে; না-পাওয়া মাসে মৃদু টিক। | B |
| `scenes.ghost.place` | {name}: the numbers published in places.json | {name}: places.json-এ প্রকাশিত সংখ্যা | B |
| `scenes.ghost.sameRecord` | Same grid cell as {name}: the same record. | {name}-এর একই গ্রিড ঘর: একই রেকর্ড। | B |
| `scenes.ghost.scale.heat` | 1 °C = 2% of the Earth's radius | ১ °সে = পৃথিবীর ব্যাসার্ধের ২% | B |
| `scenes.ghost.scale.rain` | 1 mm/day = 2% of the Earth's radius | ১ মিমি/দিন = পৃথিবীর ব্যাসার্ধের ২% | B |
| `scenes.ghost.scale.water` | 10 cm = 0.8% of the Earth's radius | ১০ সেমি = পৃথিবীর ব্যাসার্ধের ০.৮% | B |
| `scenes.ghost.values` | {then} → {now} {unit} | {then} → {now} {unit} | B |
| `scenes.ghost.windows` | Then {a} (silver ghost) · now {b} (solid) | তখন {a} (রুপালি ছায়া) · এখন {b} (নিরেট) | B |
| `scenes.ghost.yearly` | Plays one value per year (that year's mean of the months present), then window first. | প্রতি বছরে একটি মান বাজে (সেই বছরের উপস্থিত মাসগুলোর গড়), আগে তখনের সময়কাল। | B |
| `scenes.loading` | Loading the scene's records | দৃশ্যের রেকর্ড লোড হচ্ছে… | B |
| `scenes.note` | 3D scenes from records the app already ships: context layers, not EIC frames. | অ্যাপের নিজের রেকর্ড থেকে তৈরি ত্রিমাত্রিক দৃশ্য: প্রেক্ষাপট স্তর, EIC ফ্রেম নয়। | B |
| `scenes.rainSheets` | Rain particles | বৃষ্টির কণা | B |
| `scenes.rainTime` | IMERG {datetime} UTC | IMERG {datetime} UTC | B |
| `scenes.relief` | Relief | ভূমিরূপ | B |
| `scenes.scrub.rain` | Rain time (last 24 hours) | বৃষ্টির সময় (গত ২৪ ঘণ্টা) | B |
| `scenes.stars` | Stars | তারা | B |
| `scenes.tactile.saved` | Saved {file} | {file} সংরক্ষিত | B |
| `scenes.terrain.anomalyFrame` | Anomaly: EIC frame SVS 5176, {datetime} UTC | স্বাভাবিকের তুলনা: EIC ফ্রেম SVS 5176, {datetime} UTC | B |
| `scenes.terrain.anomalyNone` | No anomaly here (land or sea ice) | এখানে স্বাভাবিকের তুলনা নেই (স্থল বা সমুদ্রের বরফ) | B |
| `scenes.terrain.anomalyValue` | {value} °C vs normal | স্বাভাবিকের তুলনায় {value} °C | B |
| `scenes.terrain.axis` | Zoomed axis: {min}–{max} °C | জুম করা অক্ষ: {min}–{max} °সে | B |
| `scenes.terrain.axisSpoken` | Zoomed axis: the ocean rule's {lo} to {hi} hertz now spans {min} to {max} degrees, this region's range today. | জুম করা অক্ষ: সাগরের নিয়মের {lo} থেকে {hi} হার্জ এখন {min} থেকে {max} ডিগ্রি জুড়ে, আজ এই অঞ্চলের সীমা। | B |
| `scenes.terrain.clarity` | Last clear 1 km look: {hours} h before the analysis (echo length) | শেষ পরিষ্কার ১ কিমি পর্যবেক্ষণ: বিশ্লেষণের {hours} ঘণ্টা আগে (প্রতিধ্বনির দৈর্ঘ্য) | B |
| `scenes.terrain.goalOn` | Hunt on: follow the pitch upwards. | খোঁজ চলছে: সুর যেদিকে চড়ে সেদিকে যান। | B |
| `scenes.terrain.height` | 1 °C = {per} of height | ১ °সে = {per} উচ্চতা | B |
| `scenes.terrain.land` | Land: silent | স্থল: নীরব | B |
| `scenes.terrain.legend` | Sea surface temperature (the frame's own colours) | সাগরপৃষ্ঠের তাপমাত্রা (ফ্রেমের নিজের রং) | B |
| `scenes.terrain.vsNormalOff` | Now hearing the temperature itself. | এখন শুনছেন তাপমাত্রা নিজেই। | B |
| `scenes.terrain.vsNormalOn` | Now hearing how far from normal (SVS 5176), around a fixed reference tone. | এখন শুনছেন স্বাভাবিক থেকে কতটা দূরে (SVS 5176), একটি স্থির তুলনার সুরের চারপাশে। | B |
| `scenes.terrain.walk` | Walk speed | হাঁটার গতি | B |
| `scenes.tunnel.beads` | Beads: area follows GPCP mm/day (radius {per} × √mm/day); no bead = no GPCP month | পুঁতি: ক্ষেত্রফল GPCP মিমি/দিন অনুযায়ী (ব্যাসার্ধ {per} × √মিমি/দিন); পুঁতি নেই = GPCP মাস নেই | B |
| `scenes.tunnel.heat` | April–May: {value} °C | এপ্রিল–মে: {value} °সে | B |
| `scenes.tunnel.june` | June (monsoon start) glows | জুন (বর্ষার শুরু) জ্বলে | B |
| `scenes.tunnel.rainMonths` | {n} months of GPCP rain | {n} মাসের GPCP বৃষ্টি | B |
| `scenes.tunnel.rings` | {n} rings, {from} to {to} | {n}টি বলয়, {from} থেকে {to} | B |
| `scenes.tunnel.window` | Window {label} | সময়কাল {label} | B |
| `scenes.tunnel.year` | Year | বছর | B |
| `scenes.unit.celsius` | °C | °সে | B |
| `scenes.unit.cm` | cm | সেমি | B |
| `scenes.unit.mmDay` | mm/day | মিমি/দিন | B |
| `turntable.arrived` | Arrived: {place}. {reading}. | পৌঁছেছি: {place}। {reading}। | B |
| `turntable.bookmark` | {key}: {place} | (template) {n}: {place} | B |
| `turntable.comingNext` | Coming next | শিগগির আসছে | B |
| `turntable.dock` | Turntable controls | টার্নটেবিলের নিয়ন্ত্রণ | B |
| `turntable.graticule` | Grid lines | গ্রিড রেখা | B |
| `turntable.graticule.cancer` | Tropic of Cancer | কর্কটক্রান্তি রেখা | B |
| `turntable.graticule.capricorn` | Tropic of Capricorn | মকরক্রান্তি রেখা | B |
| `turntable.graticule.equator` | Equator | বিষুবরেখা | B |
| `turntable.idleHint` | Press / to search a place | জায়গা খুঁজতে / চাপুন | B |
| `turntable.inset` | World map: the dot is the needle | বিশ্ব মানচিত্র: বিন্দুটি সুই | B |
| `turntable.intro.skip` | Press any key to skip | এড়িয়ে যেতে যেকোনো কী চাপুন | B |
| `turntable.kind.city` | City | শহর | B |
| `turntable.kind.country` | Country | দেশ | B |
| `turntable.kind.district` | District, Bangladesh | জেলা, বাংলাদেশ | B |
| `turntable.kind.sea` | Sea or ocean | সাগর বা মহাসাগর | B |
| `turntable.kind.story` | Story place | গল্পের জায়গা | B |
| `turntable.lat` | (template) {n}° S | (template) {n}° দক্ষিণ | B |
| `turntable.legend.noValue` | No value here | এখানে কোনো মান নেই | B |
| `turntable.legend.ocean` | This frame's ocean temperature range | এই ফ্রেমের সমুদ্রের তাপমাত্রার সীমা | B |
| `turntable.legend.pixel` | Frame pixel under the needle | সুইয়ের নিচে ফ্রেমের পিক্সেল | B |
| `turntable.legend.rain` | This frame's rain range (logarithmic) | এই ফ্রেমের বৃষ্টির সীমা (লগারিদমিক) | B |
| `turntable.loading` | Loading the turntable | টার্নটেবিল লোড হচ্ছে | B |
| `turntable.lon` | (template) {n}° W | (template) {n}° পশ্চিম | B |
| `turntable.more` | More | আরও | B |
| `turntable.myLocation.note` | Used once to fly there. Never stored or sent anywhere. | শুধু সেখানে যেতে একবার ব্যবহার হয়। কখনো সংরক্ষণ বা কোথাও পাঠানো হয় না। | B |
| `turntable.opacity.value` | (template) Data layer {n}% | (template) ডেটা স্তর {n}% | B |
| `turntable.record.agriculture` | Agriculture | কৃষি | B |
| `turntable.record.air` | Air | বায়ু | B |
| `turntable.record.both` | Ocean + Rain | সমুদ্র + বৃষ্টি | B |
| `turntable.record.description` | The record shows the Earth as grooves: outer is north, inner is south. The needle is on the groove for {lat}. | রেকর্ডে পৃথিবী খাঁজ হয়ে আছে: বাইরের দিকে উত্তর, ভেতরের দিকে দক্ষিণ। সুই {lat}-এর খাঁজে আছে। | B |
| `turntable.record.disasters` | Disasters | দুর্যোগ | B |
| `turntable.record.energy` | Energy | শক্তি | B |
| `turntable.record.fire` | Fire | আগুন | B |
| `turntable.record.forests` | Forests | বন | B |
| `turntable.record.ghg` | Greenhouse gases | গ্রিনহাউস গ্যাস | B |
| `turntable.record.ocean` | Ocean | সমুদ্র | B |
| `turntable.record.rain` | Rain | বৃষ্টি | B |
| `turntable.record.seaLevel` | Sea level | সমুদ্রপৃষ্ঠের উচ্চতা | B |
| `turntable.record.water` | Water and groundwater | পানি ও ভূগর্ভস্থ পানি | B |
| `turntable.search.count` | (template) {n} places found | (template) {n}টি জায়গা পাওয়া গেছে | B |
| `turntable.search.loading` | Places are still loading | জায়গাগুলো এখনও লোড হচ্ছে | B |
| `turntable.search.none` | No place found | কোনো জায়গা পাওয়া যায়নি | B |
| `turntable.search.placeholder` | Search a place: Dhaka, Sundarbans, Bay of Bengal… | জায়গা খুঁজুন: ঢাকা, সুন্দরবন, বঙ্গোপসাগর… | B |
| `turntable.settings` | Globe settings | গ্লোবের সেটিংস | B |
| `turntable.skip` | Skip animation | অ্যানিমেশন এড়িয়ে যান | B |
| `turntable.sleeve.cover` | Cover | প্রচ্ছদ | B |
| `turntable.sleeve.details` | Details | বিস্তারিত | B |
| `turntable.sleeve.playing` | Playing | বাজছে | B |
| `turntable.speak` | {value}, at {place}, {latlon}. Frame time {datetime} UTC, latest available. | {value}, {place}, {latlon}। ফ্রেমের সময় {datetime} UTC, সর্বশেষ প্রাপ্ত। | B |
| `turntable.sun.day` | Always day | সবসময় দিন | B |
| `turntable.sun.frame` | Sun at frame time | ফ্রেমের সময়ের সূর্য | B |
| `turntable.sun.label` | Light | আলো | B |
| `turntable.tour.at` | Tour stop {index} of {total}: {place} | (template) ট্যুর, {n}টির মধ্যে {n} নম্বর: {place} | B |
| `turntable.tour.done` | Tour finished | ট্যুর শেষ | B |
| `turntable.tour.stop.announce` | Tour stopped | ট্যুর থামানো হয়েছে | B |
| `turntable.where.city` | {city}, {country} | {city}, {country} | B |
| `turntable.where.district` | {district} District | {district} জেলা | B |
| `turntable.where.near` | (template) {n} km {dir} of {city}, {country} | (template) {city}, {country} থেকে {n} কিমি undefined | B |
| `turntable.where.nearSpoken` | (template) {n} kilometres undefined of {city}, {country} | (template) {city}, {country} থেকে {n} কিলোমিটার undefined | B |
| `turntable.where.unnamed` | No named place nearby | কাছাকাছি নামওয়ালা কোনো জায়গা নেই | B |
| `turntable.zoomIn` | Zoom in | জুম ইন | B |
| `turntable.zoomOut` | Zoom out | জুম আউট | B |

## 6. Data-file sentences and mapping-rule words (Session A)

In `src/lib/i18n/bn/data.ts` (entries marked "Drafts, review first") and `src/lib/i18n/bn/rules.ts`: the sentences from mapping.json's newer voices (the normal tone, clarity, proof in unison, water's legend, the stale hiss), the units "°C vs normal" and "hours since a 1 km infrared look", the word for echo length (প্রতিধ্বনির দৈর্ঘ্য) and the Bangla "same rule as" sentence for proof in unison.

## Consistency fixes made while combining

- `braille.bl.stop` (A): বন্ধ → থামান. Stop is থামান; বন্ধ করুন is Close.
- `sound.play` (A): শব্দ চালান → শব্দ বাজান. Play is বাজান.
- `scenes.play` (B): চালান → বাজান, shown above with the glossary word; Session B applies it in `src/components/Scenes/strings-bn.ts`.
- Pause is বিরতি দিন, Stop is থামান (Pratik, 2026-11-10): Session A's `sound.pause`, `sound.paused`, `motion.pause`, `official.pause`, `braille.bl.pause` and `key.space.action` changed; Session B's Pause strings (e.g. `scenes.pause`) are shown with বিরতি দিন and B applies them.
- Left as they are: "low" and "high" are কম / বেশি for data levels (`level.*`) and নিম্ন / উচ্চ for graphics quality and confidence (`turntable.quality.*`, `scenes.conf.*`), which are different senses.
