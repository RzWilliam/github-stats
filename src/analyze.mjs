// Helpers that crunch the contribution calendar.

// Flattens the weeks into an ordered list of days { date, weekday, contributionCount }.
export function flattenDays(calendar) {
  return calendar.weeks.flatMap((w) => w.contributionDays);
}

// Current streak: number of consecutive days with at least one contribution, counting
// back from today. A trailing day at 0 (today isn't over yet) does not break the streak.
export function currentStreak(days) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) streak++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return streak;
}

// "Nice" scale for the Y axis: returns { max, step } with a round step (1, 2, 5 ×10ⁿ).
export function niceScale(maxValue, targetTicks = 8) {
  if (maxValue <= 0) return { max: 1, step: 1 };
  const rawStep = maxValue / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= mag;
  return { max: Math.ceil(maxValue / step) * step, step };
}

// Month markers: one point per month change, keeping every other one to avoid
// crowding the X axis. Returns [{ index, label: "YY/MM" }].
export function monthMarkers(days) {
  const markers = [];
  let prev = null;
  days.forEach((d, i) => {
    const ym = d.date.slice(0, 7);
    if (ym !== prev) {
      markers.push({ index: i, label: `${d.date.slice(2, 4)}/${d.date.slice(5, 7)}` });
      prev = ym;
    }
  });
  return markers.filter((_, i) => i % 2 === 0);
}
