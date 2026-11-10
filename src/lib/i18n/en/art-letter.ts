// A letter to the future (docs/statement/ART.md). Built only from data; braille rules apply.

export const letterEn = {
  "letter.title": "A letter to the future",
  "letter.leave": "Leave a letter",
  "letter.save": "Save the letter",
  "letter.close": "Close the letter",
  "letter.head": (p: { place: string; date: string }) => `${p.place}, ${p.date}.`,
  "letter.ocean": (p: { value: string }) => `Sea surface ${p.value}.`,
  "letter.rain": (p: { value: string }) => `Rain ${p.value}.`,
  "letter.dry": "No rain falling here.",
  "letter.by": (p: { source: string }) => `Measured by ${p.source}, read and checked by Bloop.`,
  "letter.median": (p: { error: string }) => `Median error ${p.error} degrees.`,
  "letter.percent": (p: { percent: string }) => `Typical difference about ${p.percent}%.`,
  "letter.pattern": (p: { record: string }) => `${p.record}: pattern only; no value recorded.`,
  "letter.none": "No value here: land, or no measurement.",
  "letter.noValue": "no value recorded",
  "letter.field.date": "Date",
  "letter.field.place": "Place",
  "letter.field.value": "Value",
  "letter.field.source": "Source",
  "letter.field.link": "Link",
  "letter.note": "Only measured values: the date of the frame, the value under the needle, and how it was checked.",
  "letter.hwgt.subject": "the letter",
  "letter.hwgt.method": "The value under the needle, read from the frame by the same function the sound plays; the date is the frame's; the error is the record's validation line.",
};

export const tourEn = {
  "tour.data": (p: { source: string; period: string }) => `Data: ${p.source}; frame ${p.period}.`,
  "tour.dataSpan": (p: { source: string; from: string; to: string }) => `Data: ${p.source}; frames ${p.from} to ${p.to}.`,
};
