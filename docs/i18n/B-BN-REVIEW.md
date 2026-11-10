# Session B: Bangla drafts for review

Every string in the Turntable's and the 3D scenes' files, with the draft Bangla that now shows in Bangla mode (developer drafts, not yet checked by a translator). Generated from `src/components/Turntable/strings-bn.ts`, `src/components/Scenes/strings-bn.ts` and `src/lib/i18n/bn/turntable.ts`. Rows marked **review first** are Pratik's priority items. Names, organisations, dataset titles and record titles stay as in English. `{name}` is a value filled in at run time.

## Controls (90)

| Key | English | Draft Bangla |
|---|---|---|
| `turntable.records` | Records | রেকর্ড |
| `turntable.sleeve.play` | Play the {record} record | {record} রেকর্ড বাজান |
| `turntable.sleeve.flip` | Show the {record} cover | {record} রেকর্ডের প্রচ্ছদ দেখান |
| `turntable.turn` | Turn | ঘোরান |
| `turntable.stopTurning` | Stop turning | ঘোরানো থামান |
| `turntable.slower` | Slower | ধীরে |
| `turntable.faster` | Faster | দ্রুত |
| `turntable.speed` | Speed {speed}× | গতি {speed}× |
| `turntable.flatMap` | Flat map | সমতল মানচিত্র |
| `turntable.view.jukebox` | Jukebox view | জুকবক্স দৃশ্য |
| `turntable.view.explore` | Close-up view | কাছ থেকে দৃশ্য |
| `turntable.view.label` | View | দৃশ্য |
| `turntable.opacity` | Data layer | ডেটা স্তর |
| `turntable.quality` | Quality | ছবির মান |
| `turntable.quality.auto` | Auto | স্বয়ংক্রিয় |
| `turntable.quality.ultra` | Ultra | সর্বোচ্চ |
| `turntable.quality.high` | High | উচ্চ |
| `turntable.quality.low` | Low | নিম্ন |
| `turntable.dock.speed` | Turning and speed | ঘোরা ও গতি |
| `turntable.dock.layers` | Layers and sound | স্তর ও শব্দ |
| `turntable.dock.settings` | Settings | সেটিংস |
| `turntable.dock.help` | Keys and help | কী ও সাহায্য |
| `turntable.more.back` | Back | ফিরে যান |
| `turntable.sources` | Sources and checks | উৎস ও যাচাই |
| `turntable.details.open` | Details of the value under the needle | সুইয়ের নিচের মানের বিস্তারিত |
| `turntable.details.pin` | Keep details open | বিস্তারিত খোলা রাখুন |
| `turntable.details.unpin` | Let details close | বিস্তারিত বন্ধ হতে দিন |
| `turntable.details.close` | Close details | বিস্তারিত বন্ধ করুন |
| `turntable.layers.note` | Borders and names are decoration. The data layer, values and sound don't change. | সীমানা ও নাম কেবল সাজ। ডেটা স্তর, মান ও শব্দ বদলায় না। |
| `turntable.layers.decoration` | Background and map layers | পটভূমি ও মানচিত্রের স্তর |
| `turntable.layers.labels` | Place names | স্থানের নাম |
| `turntable.layers.borders` | Borders | সীমানা |
| `turntable.layers.districts` | Districts | জেলা |
| `turntable.layers.rivers` | Rivers | নদী |
| `turntable.layers.sound` | Sound mixer | শব্দ মিশ্রণ |
| `turntable.creditsLink` | Credits | কৃতজ্ঞতা |
| `turntable.search.label` | Search places | জায়গা খুঁজুন |
| `turntable.search.short` | Search | খুঁজুন |
| `turntable.where.button` | Where am I? | আমি কোথায়? |
| `turntable.bookmarks` | Bookmarks | বুকমার্ক |
| `turntable.tour.start` | Tour | ট্যুর |
| `turntable.tour.stop` | Stop tour | ট্যুর থামান |
| `turntable.myLocation` | My location | আমার অবস্থান |
| `turntable.panels.hide` | Hide panels | প্যানেল লুকান |
| `turntable.panels.show` | Show panels | প্যানেল দেখান |
| `turntable.announce.record` | Record: {record}. {frames} | রেকর্ড: {record}। {frames} |
| `key.tt.leftRight` | Left / Right | বাম / ডান |
| `key.tt.leftRight.action` | Turn the globe 1 degree (with Shift: 10 degrees); stops the turning | গ্লোব ১ ডিগ্রি ঘোরান (Shift সহ: ১০ ডিগ্রি); ঘোরানো থেমে যায় |
| `key.tt.upDown` | Up / Down | ওপর / নিচ |
| `key.tt.upDown.action` | Move the needle 1 degree north or south (with Shift: 10 degrees), up to 80 degrees | সুই ১ ডিগ্রি উত্তরে বা দক্ষিণে সরান (Shift সহ: ১০ ডিগ্রি), ৮০ ডিগ্রি পর্যন্ত |
| `key.tt.space.action` | Start or stop the turning | ঘোরানো শুরু বা বন্ধ করুন |
| `key.tt.enter.action` | Speak the value, place and frame time under the needle, and show its details | সুইয়ের নিচের মান, জায়গা ও ফ্রেমের সময় শুনুন, বিস্তারিত দেখুন |
| `key.tt.details.action` | Show or hide the details of the value under the needle | সুইয়ের নিচের মানের বিস্তারিত দেখান বা লুকান |
| `key.tt.dock.action` | Move focus to the controls (D still turns describing on or off) | নিয়ন্ত্রণে ফোকাস নিন (D আগের মতোই বর্ণনা চালু/বন্ধ করে) |
| `key.tt.r.action` | Next / previous record | পরের / আগের রেকর্ড |
| `key.tt.search.action` | Search a place (G works too) | জায়গা খুঁজুন (G-ও কাজ করে) |
| `key.tt.where.action` | Where am I? (Shift+L: hear the legend) | আমি কোথায়? (Shift+L: লেজেন্ড শুনুন) |
| `key.tt.bookmarks.action` | Jump to a bookmarked place | বুকমার্ক করা জায়গায় যান |
| `key.tt.tour.action` | Start or stop the tour | ট্যুর শুরু বা বন্ধ করুন |
| `key.tt.zoom.action` | Zoom in / out | জুম ইন / আউট |
| `key.tt.speed.action` | Turn slower / faster | ধীরে / দ্রুত ঘোরান |
| `key.tt.view.action` | Jukebox view / close-up view | জুকবক্স দৃশ্য / কাছ থেকে দৃশ্য |
| `key.tt.opacity.action` | Data layer opacity (0, 25, 50, 85, 100%) | ডেটা স্তরের অস্বচ্ছতা (০, ২৫, ৫০, ৮৫, ১০০%) |
| `key.tt.esc.action` | Stop a tour or flight, or close search; otherwise stop all sound and go back to the flat map | ট্যুর বা উড়ান থামান, বা সার্চ বন্ধ করুন; না হলে সব শব্দ থামিয়ে সমতল মানচিত্রে ফিরুন |
| `scenes.open` | Open the {scene} scene | {scene} দৃশ্য খুলুন |
| `scenes.play` | Play | চালান |
| `scenes.pause` | Pause | থামান |
| `scenes.back` | Back to turntable | টার্নটেবিলে ফিরুন |
| `scenes.layers.note` | Decoration only: the values and sounds never change. | শুধু সাজসজ্জা: মান ও শব্দ কখনো বদলায় না। |
| `scenes.layers.heading` | Show | দেখান |
| `scenes.speed` | {speed}× | {speed}× |
| `scenes.tactile` | Export tactile record (STL) | স্পর্শযোগ্য রেকর্ড রপ্তানি (STL) |
| `scenes.ghost.record` | Record | রেকর্ড |
| `scenes.ghost.layer.heat` | Heat | তাপ |
| `scenes.ghost.layer.rain` | Rain | বৃষ্টি |
| `scenes.ghost.layer.water` | Water | পানি |
| `scenes.ghost.show.ghost` | Then (silver ghost) | তখন (রুপালি ছায়া) |
| `scenes.ghost.show.core` | Blue Marble core | ব্লু মার্বেল কেন্দ্র |
| `scenes.delta.show.rivers` | Rivers | নদী |
| `scenes.delta.show.districts` | Districts (when close) | জেলা (কাছে গেলে) |
| `scenes.terrain.goal` | Find the warmest water | উষ্ণতম পানি খুঁজুন |
| `scenes.tunnel.jump` | Jump to {label} | {label}-এ যান |
| `scenes.tunnel.speed` | {speed} years/s | {speed} বছর/সেকেন্ড |
| `key.sc.all` | Every scene | প্রতিটি দৃশ্য |
| `key.sc.all.action` | Space: play or pause · [ / ]: slower or faster · I: details · O: layers · H: help · Shift+D: the controls · Esc: back to the turntable | Space: চালান বা থামান · [ / ]: ধীরে বা দ্রুত · I: বিস্তারিত · O: স্তর · H: সাহায্য · Shift+D: নিয়ন্ত্রণ · Esc: টার্নটেবিলে ফিরুন |
| `key.sc.ghost.action` | Arrows: turn one grid cell (with Shift: five) · 1–3: heat, rain or water · Enter: play both windows · /: search · + / −: zoom | তীর: এক গ্রিড ঘর ঘোরান (Shift দিয়ে পাঁচ) · ১–৩: তাপ, বৃষ্টি বা পানি · Enter: দুই সময়কাল বাজান · /: খুঁজুন · + / −: জুম |
| `key.sc.delta.action` | Arrows or W A S D: move one degree (with Shift: ten) · , / .: month · Shift+, / .: rain frame · Enter: speak · + / −: zoom | তীর বা W A S D: এক ডিগ্রি সরান (Shift দিয়ে দশ) · , / .: মাস · Shift+, / .: বৃষ্টির ফ্রেম · Enter: বলুন · + / −: জুম |
| `key.sc.terrain.action` | W / S: walk · A / D: step sideways · Left / Right: turn (with Shift: faster) · Enter: speak · G: find the warmest water · N: the temperature or how far from normal · , / .: rain frame · + / −: zoom | W / S: হাঁটুন · A / D: পাশে সরুন · বাম / ডান: ঘুরুন (Shift দিয়ে দ্রুত) · Enter: বলুন · G: সবচেয়ে উষ্ণ পানি খুঁজুন · N: তাপমাত্রা নাকি স্বাভাবিক থেকে কতটা দূরে · , / .: বৃষ্টির ফ্রেম · + / −: জুম |
| `key.sc.tunnel.action` | Arrows: next or previous year (with Shift: ten) · 1 / 2: jump to a window · Enter: speak | তীর: পরের বা আগের বছর (Shift দিয়ে দশ) · ১ / ২: একটি সময়কালে যান · Enter: বলুন |
| `scenes.terrain.vsNormal` | Vs normal | স্বাভাবিকের তুলনায় |

## Announcements (16)

| Key | English | Draft Bangla |
|---|---|---|
| `turntable.frameTime` | Frame: {datetime} UTC | ফ্রেম: {datetime} UTC |
| `turntable.announce.frame` | {product}, latest available frame {datetime} UTC. | {product}, সর্বশেষ প্রাপ্ত ফ্রেম {datetime} UTC। |
| `turntable.announce.turning` | Turning | ঘুরছে |
| `turntable.announce.stoppedTurning` | Turning stopped | ঘোরানো থেমেছে |
| `turntable.announce.view` | {view}. | {view}। |
| `turntable.stopped` **review first** | Stopped. Back to the flat map. | থেমেছে। সমতল মানচিত্রে ফেরা হলো। |
| `caption.earcon.needleDrop` **review first** | Needle drop: a new record | সুই নামল: নতুন রেকর্ড |
| `scenes.ghost.say` | {where}. {a}: {then} {unit}. {b}: {now} {unit}. Change {change}. | {where}। {a}: {then} {unit}। {b}: {now} {unit}। পরিবর্তন {change}। |
| `scenes.ghost.sayHollow` | {where}. No data in one of the windows here. | {where}। এখানে একটি সময়কালে ডেটা নেই। |
| `scenes.delta.say` | {month}. {bd}. {nw}. {rain}. | {month}। {bd}। {nw}। {rain}। |
| `scenes.terrain.found` | Found it: {value} °C at {lat}, {lon}, the warmest water in this region in today's frame. | পেয়েছেন: {lat}, {lon}-এ {value} °সে, আজকের ফ্রেমে এই অঞ্চলের উষ্ণতম পানি। |
| `scenes.terrain.say` | {value} degrees at {lat}, {lon}. | {lat}, {lon}-এ {value} ডিগ্রি। |
| `scenes.terrain.sayLand` | Land at {lat}, {lon}: silent. | {lat}, {lon}-এ স্থল: নীরব। |
| `scenes.tunnel.say` | {year}. {heat}. {rain}. | {year}। {heat}। {rain}। |
| `scenes.tunnel.end` | End of the record: back to the turntable. | রেকর্ড শেষ: টার্নটেবিলে ফেরা। |
| `scenes.terrain.sayAnomaly` | {value} degrees from normal at {lat}, {lon}. | {lat}, {lon}-এ স্বাভাবিক থেকে {value} ডিগ্রি। |

## Errors and missing data (12)

| Key | English | Draft Bangla |
|---|---|---|
| `turntable.missing` | none | নেই |
| `turntable.error` | Measured error: {text} | পরিমাপিত ত্রুটি: {text} |
| `turntable.error.rain` **review first** | (template) typically within ~{n}% | (template) সাধারণত ~{n}%-এর মধ্যে |
| `turntable.error.ocean` **review first** | (template) median {n} °C against NASA MUR ({n} points, latest frame) | (template) মধ্যমা {n} °সে, NASA MUR-এর তুলনায় ({n}টি বিন্দু, সর্বশেষ ফ্রেম) |
| `turntable.myLocation.denied` | Location wasn't shared. Nothing was stored. | অবস্থান শেয়ার করা হয়নি। কিছুই সংরক্ষণ করা হয়নি। |
| `turntable.myLocation.unsupported` | This browser can't share a location. | এই ব্রাউজার অবস্থান শেয়ার করতে পারে না। |
| `scenes.failed` | Couldn't load this scene's records. Esc goes back to the turntable. | এই দৃশ্যের রেকর্ড লোড করা যায়নি। Esc চাপলে টার্নটেবিলে ফিরবেন। |
| `scenes.missing` | none | নেই |
| `scenes.ghost.hollow` | No data in a window here (hollow) | এখানে কোনো এক সময়কালে ডেটা নেই (ফাঁপা) |
| `scenes.delta.noRain` | Rain here: no data | এখানে বৃষ্টি: ডেটা নেই |
| `scenes.tunnel.noRain` | No GPCP months this year | এ বছর GPCP-র কোনো মাস নেই |
| `scenes.terrain.clarityNone` | No clear 1 km look in MUR's window: the longest echo | MUR-এর সময়সীমায় কোনো পরিষ্কার ১ কিমি পর্যবেক্ষণ নেই: সবচেয়ে লম্বা প্রতিধ্বনি |

## Headings and names (24)

| Key | English | Draft Bangla |
|---|---|---|
| `mode.turntable` | Turntable | টার্নটেবিল |
| `turntable.roleDescription` | turntable | টার্নটেবিল |
| `turntable.region` | Turntable Earth, playing the {record} record | টার্নটেবিল আর্থ, {record} রেকর্ড বাজছে |
| `turntable.instructions` | Arrows turn the globe and move the needle (Shift: 10 degrees). Enter speaks the value. Slash searches places, L says where you are, 1 to 9 jump to bookmarks, T starts a tour, plus and minus zoom, V switches the view. H lists all keys. Esc goes back to the flat map. | তীর চিহ্নের কী দিয়ে গ্লোব ঘোরান ও সুই সরান (Shift সহ: ১০ ডিগ্রি)। Enter চাপলে মান বলা হবে। স্ল্যাশ (/) দিয়ে জায়গা খুঁজুন, L চাপলে আপনি কোথায় আছেন জানাবে, ১ থেকে ৯ বুকমার্কে যায়, T দিয়ে ট্যুর শুরু, প্লাস ও মাইনাস দিয়ে জুম, V দিয়ে দৃশ্য বদলান। সব কী দেখতে H চাপুন। Esc চাপলে সমতল মানচিত্রে ফিরবেন। |
| `turntable.canvas` | A globe on a turntable with the latest available {record} frame over it. A tonearm's needle reads the point beneath it. | টার্নটেবিলে একটি গ্লোব, তার ওপর সর্বশেষ প্রাপ্ত {record} ফ্রেম। টোনআর্মের সুই নিচের বিন্দুটি পড়ে। |
| `help.turntable` | On the turntable | টার্নটেবিলে |
| `scenes.heading` | Scenes | দৃশ্য |
| `scenes.ghost.sleeve` | Ghost Earths | ভূতুড়ে পৃথিবী |
| `scenes.ghost.title` | Ghost Earths: then vs now | ভূতুড়ে পৃথিবী: তখন বনাম এখন |
| `scenes.ghost.how` | Drag or use the arrows to turn the globe (one arrow is one grid cell). Enter plays then, then now, and speaks both. 1, 2 and 3 choose heat, rain or water. Slash searches places. | টেনে বা তীরচিহ্ন দিয়ে গ্লোব ঘোরান (একবার চাপ = একটি গ্রিড ঘর)। Enter আগে তখন, পরে এখন বাজায় ও দুটি মানই বলে। ১, ২, ৩: তাপ, বৃষ্টি, পানি। স্ল্যাশ দিয়ে জায়গা খুঁজুন। |
| `scenes.ghost.canvas` | Two globes over each other: the earlier window as a silver ghost and the recent window as a solid shell, raised or lowered by the change and coloured by it. | দুটি গ্লোব একটির ওপর আরেকটি: আগের সময়কাল রুপালি ছায়া, সাম্প্রতিক সময়কাল নিরেট খোলস, পরিবর্তন অনুযায়ী উঁচু-নিচু ও রঙিন। |
| `scenes.delta.sleeve` | Delta + aquifer | ব-দ্বীপ + ভূগর্ভস্থ পানি |
| `scenes.delta.title` | The playable delta: water underground | বাজানো যায় এমন ব-দ্বীপ: মাটির নিচের পানি |
| `scenes.delta.how` | Arrows or W A S D move the needle over the delta; drag to orbit. Enter speaks the values here. Space plays both water tables on one scale, Bangladesh first. Comma and full stop step the month; Shift with them steps the rain frame. | তীরচিহ্ন বা W A S D দিয়ে সুই সরান; টেনে ঘোরান। Enter এখানকার মান বলে। স্পেস একই মাপে দুটি পানির স্তর বাজায়, আগে বাংলাদেশ। কমা ও দাঁড়ি মাস বদলায়; Shift সহ বৃষ্টির ফ্রেম বদলায়। |
| `scenes.delta.canvas` | Bangladesh in relief with its two big rivers. Below it, a cut-away block of ground water rises and falls with the GRACE record; NW India's block stands beside it on the same scale. | উঁচু-নিচু বাংলাদেশ ও তার দুটি বড় নদী। নিচে কাটা অংশে ভূগর্ভস্থ পানির স্তর GRACE রেকর্ড অনুযায়ী ওঠানামা করে; পাশে একই মাপে উত্তর-পশ্চিম ভারতের স্তর। |
| `scenes.terrain.sleeve` | Sound terrain | শব্দের ভূখণ্ড |
| `scenes.terrain.title` | Sound terrain: Bay of Bengal | শব্দের ভূখণ্ড: বঙ্গোপসাগর |
| `scenes.terrain.how` | Arrows or W A S D walk (Shift: faster); drag to look around. Under your feet you hear the sea temperature on a zoomed axis. Enter speaks it. G starts the warmest-water hunt. | তীরচিহ্ন বা W A S D দিয়ে হাঁটুন (Shift: দ্রুত); টেনে চারপাশ দেখুন। পায়ের নিচে সাগরের তাপমাত্রা শোনেন জুম করা অক্ষে। Enter মান বলে। G উষ্ণতম পানির খোঁজ শুরু করে। |
| `scenes.terrain.canvas` | The Bay of Bengal as a landscape: higher ground is warmer water, coloured by NASA's own map. Rain from the last 24 hours drifts over it. | বঙ্গোপসাগর এক ভূদৃশ্য: উঁচু মানে উষ্ণ পানি, NASA-র নিজের মানচিত্রের রঙে। গত ২৪ ঘণ্টার বৃষ্টি এর ওপর দিয়ে ভেসে যায়। |
| `scenes.tunnel.sleeve` | Dhaka time tunnel | ঢাকা সময়-সুড়ঙ্গ |
| `scenes.tunnel.title` | Dhaka time tunnel | ঢাকা সময়-সুড়ঙ্গ |
| `scenes.tunnel.how` | Space flies through the years; [ and ] change speed; left and right step one year; 1 and 2 jump to the two windows. Enter speaks the year. | স্পেস বছরগুলোর মধ্য দিয়ে ওড়ায়; [ ও ] গতি বদলায়; বাম ও ডান এক বছর সরায়; ১ ও ২ দুটি সময়কালে যায়। Enter বছরটি বলে। |
| `scenes.tunnel.canvas` | A tunnel of rings, one per year. Each ring's colour is that year's April–May heat anomaly; its twelve beads are the months' rain. | বছরপ্রতি একটি করে বলয়ের সুড়ঙ্গ। প্রতিটি বলয়ের রং সেই বছরের এপ্রিল–মে তাপের অস্বাভাবিকতা; বারোটি পুঁতি মাসগুলোর বৃষ্টি। |
| `help.scenes` | In the 3D scenes | ত্রিমাত্রিক দৃশ্যে |

## The rest (133)

| Key | English | Draft Bangla |
|---|---|---|
| `turntable.record.ocean` | Ocean | সমুদ্র |
| `turntable.record.rain` | Rain | বৃষ্টি |
| `turntable.record.both` | Ocean + Rain | সমুদ্র + বৃষ্টি |
| `turntable.record.air` | Air | বায়ু |
| `turntable.record.forests` | Forests | বন |
| `turntable.record.fire` | Fire | আগুন |
| `turntable.record.energy` | Energy | শক্তি |
| `turntable.record.seaLevel` | Sea level | সমুদ্রপৃষ্ঠের উচ্চতা |
| `turntable.record.disasters` | Disasters | দুর্যোগ |
| `turntable.record.agriculture` | Agriculture | কৃষি |
| `turntable.record.water` | Water and groundwater | পানি ও ভূগর্ভস্থ পানি |
| `turntable.record.ghg` | Greenhouse gases | গ্রিনহাউস গ্যাস |
| `turntable.comingNext` | Coming next | শিগগির আসছে |
| `turntable.sleeve.details` | Details | বিস্তারিত |
| `turntable.sleeve.cover` | Cover | প্রচ্ছদ |
| `turntable.sleeve.playing` | Playing | বাজছে |
| `turntable.zoomIn` | Zoom in | জুম ইন |
| `turntable.zoomOut` | Zoom out | জুম আউট |
| `turntable.opacity.value` | (template) Data layer {n}% | (template) ডেটা স্তর {n}% |
| `turntable.sun.label` | Light | আলো |
| `turntable.sun.frame` | Sun at frame time | ফ্রেমের সময়ের সূর্য |
| `turntable.sun.day` | Always day | সবসময় দিন |
| `turntable.graticule` | Grid lines | গ্রিড রেখা |
| `turntable.settings` | Globe settings | গ্লোবের সেটিংস |
| `turntable.dock` | Turntable controls | টার্নটেবিলের নিয়ন্ত্রণ |
| `turntable.more` | More | আরও |
| `turntable.intro.skip` | Press any key to skip | এড়িয়ে যেতে যেকোনো কী চাপুন |
| `turntable.loading` | Loading the turntable | টার্নটেবিল লোড হচ্ছে |
| `turntable.skip` | Skip animation | অ্যানিমেশন এড়িয়ে যান |
| `turntable.search.placeholder` | Search a place: Dhaka, Sundarbans, Bay of Bengal… | জায়গা খুঁজুন: ঢাকা, সুন্দরবন, বঙ্গোপসাগর… |
| `turntable.search.none` | No place found | কোনো জায়গা পাওয়া যায়নি |
| `turntable.search.loading` | Places are still loading | জায়গাগুলো এখনও লোড হচ্ছে |
| `turntable.search.count` | (template) {n} places found | (template) {n}টি জায়গা পাওয়া গেছে |
| `turntable.kind.story` | Story place | গল্পের জায়গা |
| `turntable.kind.country` | Country | দেশ |
| `turntable.kind.city` | City | শহর |
| `turntable.kind.district` | District, Bangladesh | জেলা, বাংলাদেশ |
| `turntable.kind.sea` | Sea or ocean | সাগর বা মহাসাগর |
| `turntable.where.city` | {city}, {country} | {city}, {country} |
| `turntable.where.near` | (template) {n} km {dir} of {city}, {country} | (template) {city}, {country} থেকে {n} কিমি undefined |
| `turntable.where.nearSpoken` | (template) {n} kilometres undefined of {city}, {country} | (template) {city}, {country} থেকে {n} কিলোমিটার undefined |
| `turntable.where.district` | {district} District | {district} জেলা |
| `turntable.where.unnamed` | No named place nearby | কাছাকাছি নামওয়ালা কোনো জায়গা নেই |
| `turntable.arrived` | Arrived: {place}. {reading}. | পৌঁছেছি: {place}। {reading}। |
| `turntable.speak` | {value}, at {place}, {latlon}. Frame time {datetime} UTC, latest available. | {value}, {place}, {latlon}। ফ্রেমের সময় {datetime} UTC, সর্বশেষ প্রাপ্ত। |
| `turntable.bookmark` | {key}: {place} | (template) {n}: {place} |
| `turntable.tour.stop.announce` | Tour stopped | ট্যুর থামানো হয়েছে |
| `turntable.tour.at` | Tour stop {index} of {total}: {place} | (template) ট্যুর, {n}টির মধ্যে {n} নম্বর: {place} |
| `turntable.tour.done` | Tour finished | ট্যুর শেষ |
| `turntable.myLocation.note` | Used once to fly there. Never stored or sent anywhere. | শুধু সেখানে যেতে একবার ব্যবহার হয়। কখনো সংরক্ষণ বা কোথাও পাঠানো হয় না। |
| `turntable.idleHint` | Press / to search a place | জায়গা খুঁজতে / চাপুন |
| `turntable.credits` **review first** | 3D scenes: NASA Earth Observatory, Blue Marble Next Generation, September (Reto Stöckli) · Topography: NASA Earth Observatory (Jesse Allen), GEBCO data from the British Oceanographic Data Centre · Studio light: Poly Haven studio_small_09 (CC0) · Borders, places, rivers, seas: Natural Earth (public domain) · Districts: geoBoundaries (CC BY 3.0 IGO; source BBS, OCHA ROAP) · Data frames: NASA SVS 5101 / 4285 for the NASA Earth Information Center | ত্রিমাত্রিক দৃশ্য: NASA Earth Observatory, Blue Marble Next Generation, September (Reto Stöckli) · ভূসংস্থান: NASA Earth Observatory (Jesse Allen), British Oceanographic Data Centre-এর GEBCO ডেটা · স্টুডিওর আলো: Poly Haven studio_small_09 (CC0) · সীমানা, স্থান, নদী, সমুদ্র: Natural Earth (পাবলিক ডোমেইন) · জেলা: geoBoundaries (CC BY 3.0 IGO; উৎস BBS, OCHA ROAP) · ডেটা ফ্রেম: NASA Earth Information Center-এর জন্য NASA SVS 5101 / 4285 |
| `turntable.inset` | World map: the dot is the needle | বিশ্ব মানচিত্র: বিন্দুটি সুই |
| `turntable.legend.ocean` | This frame's ocean temperature range | এই ফ্রেমের সমুদ্রের তাপমাত্রার সীমা |
| `turntable.legend.rain` | This frame's rain range (logarithmic) | এই ফ্রেমের বৃষ্টির সীমা (লগারিদমিক) |
| `turntable.legend.pixel` | Frame pixel under the needle | সুইয়ের নিচে ফ্রেমের পিক্সেল |
| `turntable.legend.noValue` | No value here | এখানে কোনো মান নেই |
| `turntable.graticule.equator` | Equator | বিষুবরেখা |
| `turntable.graticule.cancer` | Tropic of Cancer | কর্কটক্রান্তি রেখা |
| `turntable.graticule.capricorn` | Tropic of Capricorn | মকরক্রান্তি রেখা |
| `turntable.lat` | (template) {n}° S | (template) {n}° দক্ষিণ |
| `turntable.lon` | (template) {n}° W | (template) {n}° পশ্চিম |
| `scenes.note` | 3D scenes from records the app already ships: context layers, not EIC frames. | অ্যাপের নিজের রেকর্ড থেকে তৈরি ত্রিমাত্রিক দৃশ্য: প্রেক্ষাপট স্তর, EIC ফ্রেম নয়। |
| `scenes.loading` | Loading the scene's records | দৃশ্যের রেকর্ড লোড হচ্ছে… |
| `scenes.entry` | {scene}. {how} | {scene}। {how} |
| `scenes.unit.celsius` | °C | °সে |
| `scenes.unit.mmDay` | mm/day | মিমি/দিন |
| `scenes.unit.cm` | cm | সেমি |
| `scenes.context` | Context layer, not an EIC frame | প্রেক্ষাপট স্তর, EIC ফ্রেম নয় |
| `scenes.framePaired` | Frame-paired: the EIC SST frame of {datetime} UTC | ফ্রেম-যুক্ত: {datetime} UTC-র EIC SST ফ্রেম |
| `scenes.exaggerated` | Height: {text} (exaggerated) | উচ্চতা: {text} (বাড়িয়ে দেখানো) |
| `scenes.stars` | Stars | তারা |
| `scenes.relief` | Relief | ভূমিরূপ |
| `scenes.rainSheets` | Rain particles | বৃষ্টির কণা |
| `scenes.tactile.saved` | Saved {file} | {file} সংরক্ষিত |
| `scenes.rainTime` | IMERG {datetime} UTC | IMERG {datetime} UTC |
| `scenes.scrub.rain` | Rain time (last 24 hours) | বৃষ্টির সময় (গত ২৪ ঘণ্টা) |
| `scenes.ghost.honesty` **review first** | Heat: GISTEMP land cells only. GRACE ~3° resolution. Monthly records, multi-year windows. | তাপ: শুধু GISTEMP-এর স্থলভাগের ঘর। GRACE-এর রেজোলিউশন প্রায় ৩°। মাসিক রেকর্ড, বহু বছরের সময়সীমা। |
| `scenes.ghost.windows` | Then {a} (silver ghost) · now {b} (solid) | তখন {a} (রুপালি ছায়া) · এখন {b} (নিরেট) |
| `scenes.ghost.legend` | Change, {b} minus {a} ({unit}) | পরিবর্তন, {b} বিয়োগ {a} ({unit}) |
| `scenes.ghost.scale.heat` | 1 °C = 2% of the Earth's radius | ১ °সে = পৃথিবীর ব্যাসার্ধের ২% |
| `scenes.ghost.scale.rain` | 1 mm/day = 2% of the Earth's radius | ১ মিমি/দিন = পৃথিবীর ব্যাসার্ধের ২% |
| `scenes.ghost.scale.water` | 10 cm = 0.8% of the Earth's radius | ১০ সেমি = পৃথিবীর ব্যাসার্ধের ০.৮% |
| `scenes.ghost.values` | {then} → {now} {unit} | {then} → {now} {unit} |
| `scenes.ghost.change` | Change {change} {unit} | পরিবর্তন {change} {unit} |
| `scenes.ghost.cell` | Grid cell centred {lat}, {lon} | গ্রিড ঘরের কেন্দ্র {lat}, {lon} |
| `scenes.ghost.place` | {name}: the numbers published in places.json | {name}: places.json-এ প্রকাশিত সংখ্যা |
| `scenes.ghost.sameRecord` | Same grid cell as {name}: the same record. | {name}-এর একই গ্রিড ঘর: একই রেকর্ড। |
| `scenes.ghost.confidence` | GPCP–GPCC agreement: {level} | GPCP–GPCC মিল: {level} |
| `scenes.ghost.yearly` | Plays one value per year (that year's mean of the months present), then window first. | প্রতি বছরে একটি মান বাজে (সেই বছরের উপস্থিত মাসগুলোর গড়), আগে তখনের সময়কাল। |
| `scenes.ghost.monthly` | Plays every month of each window; missing months tick softly. | প্রতিটি সময়কালের প্রতিটি মাস বাজে; না-পাওয়া মাসে মৃদু টিক। |
| `scenes.conf.high` | high | উচ্চ |
| `scenes.conf.medium` | medium | মাঝারি |
| `scenes.conf.low` | low | কম |
| `scenes.conf.satellite-only` | satellite only (no gauges) | শুধু স্যাটেলাইট (মাপক যন্ত্র নেই) |
| `scenes.delta.bd` | Bangladesh | বাংলাদেশ |
| `scenes.delta.nw` | NW India | উত্তর-পশ্চিম ভারত |
| `scenes.delta.box` | {name} box: lon {lon0}–{lon1}, lat {lat0}–{lat1} | {name} বাক্স: দ্রাঘিমা {lon0}–{lon1}, অক্ষাংশ {lat0}–{lat1} |
| `scenes.delta.resolution` | GRACE {text} | GRACE {text} |
| `scenes.delta.scale` | Both water tables on one fixed scale, {min} to {max} cm (the water voice's range) | দুটি পানির স্তর একই নির্দিষ্ট মাপে, {min} থেকে {max} সেমি (পানির কণ্ঠের সীমা) |
| `scenes.delta.month` | GRACE month | GRACE মাস |
| `scenes.delta.water` | {name}: {value} cm | {name}: {value} সেমি |
| `scenes.delta.gap` | No satellite measurement this month | এই মাসে স্যাটেলাইট পরিমাপ নেই |
| `scenes.delta.rainHere` | Rain here: {value} mm/h | এখানে বৃষ্টি: {value} মিমি/ঘণ্টা |
| `scenes.delta.dry` | Rain here: dry | এখানে বৃষ্টি: শুকনো |
| `scenes.delta.river` | {name}. River heights: coming (SWOT) | {name}। নদীর উচ্চতা: আসছে (SWOT) |
| `scenes.delta.river.Ganges` | Ganges (Padma) | গঙ্গা (পদ্মা) |
| `scenes.delta.river.Brahmaputra` | Brahmaputra (Jamuna) | ব্রহ্মপুত্র (যমুনা) |
| `scenes.delta.outside` | Outside the {name} box | {name} বাক্সের বাইরে |
| `scenes.delta.waterLegend` | Water table on the shared scale (cm) | একই মাপে পানির স্তর (সেমি) |
| `scenes.delta.noMeghna` | The Meghna isn't in the shipped river file, so it isn't drawn. | মেঘনা দেওয়া নদীর ফাইলে নেই, তাই আঁকা হয়নি। |
| `scenes.delta.semitones` | On the shared scale the window means fall {bd} semitones in Bangladesh and {nw} in NW India ({ratio}×). | একই মাপে সময়কালের গড় বাংলাদেশে {bd} সেমিটোন ও উত্তর-পশ্চিম ভারতে {nw} সেমিটোন নামে ({ratio}×)। |
| `scenes.terrain.axis` | Zoomed axis: {min}–{max} °C | জুম করা অক্ষ: {min}–{max} °সে |
| `scenes.terrain.axisSpoken` | Zoomed axis: the ocean rule's {lo} to {hi} hertz now spans {min} to {max} degrees, this region's range today. | জুম করা অক্ষ: সাগরের নিয়মের {lo} থেকে {hi} হার্জ এখন {min} থেকে {max} ডিগ্রি জুড়ে, আজ এই অঞ্চলের সীমা। |
| `scenes.terrain.legend` | Sea surface temperature (the frame's own colours) | সাগরপৃষ্ঠের তাপমাত্রা (ফ্রেমের নিজের রং) |
| `scenes.terrain.height` | 1 °C = {per} of height | ১ °সে = {per} উচ্চতা |
| `scenes.terrain.land` | Land: silent | স্থল: নীরব |
| `scenes.terrain.goalOn` | Hunt on: follow the pitch upwards. | খোঁজ চলছে: সুর যেদিকে চড়ে সেদিকে যান। |
| `scenes.terrain.walk` | Walk speed | হাঁটার গতি |
| `scenes.tunnel.credit` **review first** | Pitch-per-year idea after Daniel Crawford (2013). | প্রতি বছরের জন্য একটি সুরের উচ্চতার ধারণা, Daniel Crawford (২০১৩)-এর অনুসরণে। |
| `scenes.tunnel.year` | Year | বছর |
| `scenes.tunnel.heat` | April–May: {value} °C | এপ্রিল–মে: {value} °সে |
| `scenes.tunnel.rainMonths` | {n} months of GPCP rain | {n} মাসের GPCP বৃষ্টি |
| `scenes.tunnel.june` | June (monsoon start) glows | জুন (বর্ষার শুরু) জ্বলে |
| `scenes.tunnel.beads` | Beads: area follows GPCP mm/day (radius {per} × √mm/day); no bead = no GPCP month | পুঁতি: ক্ষেত্রফল GPCP মিমি/দিন অনুযায়ী (ব্যাসার্ধ {per} × √মিমি/দিন); পুঁতি নেই = GPCP মাস নেই |
| `scenes.tunnel.window` | Window {label} | সময়কাল {label} |
| `scenes.tunnel.rings` | {n} rings, {from} to {to} | {n}টি বলয়, {from} থেকে {to} |
| `scenes.terrain.vsNormalOn` | Now hearing how far from normal (SVS 5176), around a fixed reference tone. | এখন শুনছেন স্বাভাবিক থেকে কতটা দূরে (SVS 5176), একটি স্থির তুলনার সুরের চারপাশে। |
| `scenes.terrain.vsNormalOff` | Now hearing the temperature itself. | এখন শুনছেন তাপমাত্রা নিজেই। |
| `scenes.terrain.anomalyValue` | {value} °C vs normal | স্বাভাবিকের তুলনায় {value} °C |
| `scenes.terrain.anomalyNone` | No anomaly here (land or sea ice) | এখানে স্বাভাবিকের তুলনা নেই (স্থল বা সমুদ্রের বরফ) |
| `scenes.terrain.clarity` | Last clear 1 km look: {hours} h before the analysis (echo length) | শেষ পরিষ্কার ১ কিমি পর্যবেক্ষণ: বিশ্লেষণের {hours} ঘণ্টা আগে (প্রতিধ্বনির দৈর্ঘ্য) |
| `scenes.terrain.anomalyFrame` | Anomaly: EIC frame SVS 5176, {datetime} UTC | স্বাভাবিকের তুলনা: EIC ফ্রেম SVS 5176, {datetime} UTC |

## Not drafted (0)

None: every key in these files has Bangla.
