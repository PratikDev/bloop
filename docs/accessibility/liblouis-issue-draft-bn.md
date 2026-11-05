# Draft issue for liblouis (not filed)

> Draft for the team to review. File it at https://github.com/liblouis/liblouis/issues only after a Bengali braille reader has confirmed the expected output against the Bharati braille rules.

---

**Title:** bn.tbl: the number sign ends at a decimal point or colon; Bengali digits get no number sign; the combining nukta is undefined

**liblouis version:** 3.39.0, as shipped in NVDA 2026.3. NVDA uses `be-in-g1.utb` ("Bengali grade 1") with `braille-patterns.cti`; `bn.tbl` (which includes `spaces.ctb`, `be-in-g1.utb` and `braille-patterns.cti`) gives the same cells for everything below.

**How we tested:** forward translation with `lou_translateString` (Python `louis.translate`, `mode=dotsIO`). Table list `["bn.tbl", "braille-patterns.cti"]`, as NVDA uses it. Back-translation with `louis.backTranslateString(..., mode=ucBrl)`. Script: `tests/braille/louis_check.py` in our repository.

### 1. After a decimal point or a colon, the digits lose numeric mode

| Input | Output | Back-translation |
|---|---|---|
| `30.2` | `⠼⠉⠚⠨⠃` (3456 14 245 46 12) | `৩০.ব`: the `2` comes back as the letter ব |
| `0.458` | `⠼⠚⠨⠙⠑⠓` | `০.দএহ` |
| `10:30` | `⠼⠁⠚⠒⠉⠚` | `১০ঞচজ` |
| `(0-1)` | `⠶⠼⠚⠤⠁⠶` | `(০-অ)` |

The digits after `⠨` (the decimal point) or `⠒` (the colon) carry no number sign and aren't treated as continuing the number. Both a reader and the back-translator therefore take them as letters.

For comparison, `en-ueb-g1.ctb` gives `30.2` → `⠼⠉⠚⠲⠃` and `10:30` → `⠼⠁⠚⠒⠼⠉⠚` (the number sign repeats after the colon). Both back-translate correctly.

**Expected (please confirm against the Bharati braille rules):** either numeric mode continues across the decimal point and the colon, or the number sign repeats before the digits that follow.

### 2. Bengali digits (U+09E6–U+09EF) get no number sign

| Input | Output | Back-translation |
|---|---|---|
| `৩০` | `⠉⠚` (14 245) | `চজ` |
| `৫৬৬৯` | `⠑⠋⠋⠊` | `এffই` |
| `-৫` | `⠤⠑` | `-এ` |
| `30` (Western digits) | `⠼⠉⠚` (3456 14 245) | `৩০` |

`bengali.cti` declares the Bengali digits only as `litdigit` (lines 113–122). They are written as the letter cells a–j with no number sign, so `৩০` is indistinguishable from the letters চজ. Western digits get the number sign and back-translate to Bengali digits. So Bengali text that uses its own numerals is brailled as letters.

**Expected:** Bengali digits brailled like Western digits, with the number sign (`৩০` → `⠼⠉⠚`).

### 3. The combining nukta (U+09BC) is undefined

| Input | Output | Back-translation |
|---|---|---|
| `সেলসিয়াস` with য as U+09AF U+09BC | `⠎⠑⠇⠎⠊⠽⠄⡳⠭⠴⠔⠃⠉⠄⠜⠎` | `সএলসইযঁ\xঝঈবচঁআস` |
| the same with য় as U+09DF | `⠎⠑⠇⠎⠊⠢⠜⠎` | `সএলসইয়আস` |

U+09BC is not defined, so it comes out as the escape text `\x09bc` written in cells. The precomposed letters য় (U+09DF), ড় (U+09DC) and ঢ় (U+09DD) are defined. But Unicode NFC *decomposes* them (they are composition exclusions), so normalised Bengali text always contains U+09BC. Words such as সেলসিয়াস, জানুয়ারি and ফেব্রুয়ারি are affected.

**Expected:** U+09BC after য, ড or ঢ treated as the precomposed letter. At minimum, U+09BC should be defined so no escape text is produced.

### Note (not a bug): ⠼ is both the number sign and ণ

`19` → `⠼⠁⠊`, and `ণই` → `⠼⠁⠊` too, so the back-translation of `19` is `ণই`. In Bharati braille ণ is dots 3456, the same cell as the number sign, so the cells are genuinely ambiguous. We mention it only because a back-translation preference for digits after `⠼` might help screen-reader input.

---

*Found while testing a web app's braille output (NASA Space Apps 2026, team Bloop). We work around 1–3 in our own text: decimals as the word দশমিক, times without a colon, Western digits, and composed nukta letters.*
