# Quick listener test: how to run it

For the facilitator (mentor item 8). One session takes 5 to 8 minutes with one listener. Run it with 5 to 10 adults. The result is **formative only**: it tells us whether the sounds can be understood, not how well people in general understand them. Don't show or quote any listener's result inside the app.

## Before the session

- Use a laptop with the app open at **`/listen-test`**. The page has no link anywhere in the app; type the address.
- Use **headphones** (wired if you can), at a comfortable volume. Set it once with the intro's "Play the reference tone", then leave it.
- Choose a quiet room. **One person at a time.** Nobody else watches the screen.
- Pick the language the listener prefers with the header's language button (English or বাংলা) before you start.
- Have an empty folder ready for the exported files, for example `listen-test-results/`.

## Consent (read it aloud)

Read this before the listener touches anything. The same words are on the first screen.

**English:**
> This is a short, anonymous listening test about sounds made from NASA data. We won't ask your name, nothing is uploaded, and no sound is recorded. Your answers stay on this laptop until I save them as a file at the end. It takes about five minutes, and you can stop at any time without giving a reason. Are you 18 or older?

**Bangla:**
> এটি নাসার ডেটা থেকে তৈরি শব্দ নিয়ে একটি ছোট, নামহীন শোনার পরীক্ষা। আমরা আপনার নাম জিজ্ঞেস করব না, কিছুই আপলোড হয় না, আর কোনো শব্দ রেকর্ড করা হয় না। শেষে আমি একটি ফাইল হিসেবে সংরক্ষণ না করা পর্যন্ত আপনার উত্তর এই ল্যাপটপেই থাকবে। এতে প্রায় পাঁচ মিনিট লাগে, আর আপনি কোনো কারণ না বলে যেকোনো সময় থামতে পারেন। আপনার বয়স কি ১৮ বা তার বেশি?

If the answer is no, choose **No**. The test ends politely and nothing is kept. Thank them.

## The session

1. **Consent screen:** the listener (or you, if they ask) chooses "I understand. Continue", then **Yes** for 18 or older.
2. **How to listen (about 30 seconds):** play **"Play the reference tone"**, then **"Play low to high"**. Say: *"A higher pitch means a larger value: warmer water, or a hotter year. More drops mean heavier rain."* Let them replay both as often as they like.
3. **The tasks (usually five):** for each task the listener presses **"Play the sound"** (as often as they like), then picks an answer. The tasks are:
   - an ocean warmer or colder than the reference tone;
   - which of two cities is rainier right now (left out on a day with no rain at any of the places);
   - which of two duets (frame vs NASA's file) disagrees more;
   - in Both mode, whether rain plays with the ocean tone;
   - which of two decades of Dhaka's April–May heat is hotter.
<!-- >>> CV -->
   - **chord, variety** (CV/ML build): two ocean views (named boxes), each played as its low, middle and high
     temperature (its 10th, 50th and 90th percentile); which view has more variety? The answer is the box with the wider
     10th–90th percentile spread in today's SST frame, computed by the panel's own function.
   - **chord, groups** (CV/ML build): one ocean view played as the value chord for 4 seconds; one group or two? The box
     is today's one-group or two-group box, drawn once per session; the answer is the chord's own group count.

   With these two the session is seven tasks and still takes under 8 minutes (each adds about 30 seconds). Don't
   explain "variety" beyond "how different the temperatures in the view are from each other"; "group" is "a cluster of
   similar temperatures".
<!-- <<< CV -->
4. **Comment (optional):** ask *"Anything you'd like to tell us about the sounds?"* They type it, or you type their words. Don't type names.
5. **Finish**, then **Export results** (see below).

The time per task is logged from when the task appears to the answer, so don't hurry them. Long times are fine.

## If the listener is confused

- Don't tell them the answer or hint at it. You may repeat the question exactly as written, or say: *"Listen as many times as you like, then choose what sounds right to you."*
- If they don't understand a word, you may explain it in plain words ("reference" = "the tone to compare with"; "duet" = "two tones, one after the other").
- If they want to stop, press **"Stop the test"**. Nothing is saved, and that is fine. Thank them.
- If the sound doesn't play, check the volume and the headphones, then press "Play the sound" again. If it still doesn't play, stop the session and write a note (no names) in your own log.

## Saving the file

- On the last screen press **Export results**. The browser saves a file like `listen-test-20261108-1430.json` (date and time only).
- Rename it to the session number: `P01.json`, `P02.json`, and so on. **Never put a name in the file name.**
- Move it into the results folder. Then reload `/listen-test` for the next listener (the answers are in memory only, so a reload clears them).

The file holds, for each task: the task, the answer, the correct answer (computed from the app's data, never typed), whether it was right, and the time in milliseconds. It also holds the language and the optional comment. It never holds a name, an IP address or any audio.

## The summary

```
bun run listen-test:summary listen-test-results
# or: npm run listen-test:summary -- listen-test-results
```

It prints the number of listeners and, for each task, n, the correct count and the accuracy, labelled "formative only". Report it that way: for example, "8 listeners; ocean 7 of 8 correct". Make no claim beyond that.
