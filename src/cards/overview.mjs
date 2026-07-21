// "Overview" card — key stats on the left + this year's contribution graph on the right.
import { escapeXml, formatNumber, icons } from "../svg.mjs";
import { flattenDays, currentStreak, niceScale, monthMarkers } from "../analyze.mjs";

const WIDTH = 840;
const HEIGHT = 300;

// Graph area (right side).
const CHART_LEFT = 470;
const CHART_RIGHT = 770;
const CHART_TOP = 95;
const CHART_BOTTOM = 248;
const PLOT_W = CHART_RIGHT - CHART_LEFT;
const PLOT_H = CHART_BOTTOM - CHART_TOP;

function yearsSince(iso) {
  const created = new Date(iso).getTime();
  return Math.floor((Date.now() - created) / (365.25 * 864e5));
}

function renderLeftColumn(stats, theme) {
  const streak = currentStreak(flattenDays(stats.calendar));
  const rows = [
    { icon: icons.github, text: `${formatNumber(stats.totalContributions)} Contributions on GitHub` },
    { icon: icons.star, text: `${formatNumber(stats.totalStars)} Stars earned` },
    { icon: icons.flame, text: `Current streak: ${streak} days` },
    { icon: icons.repo, text: `${stats.repos} Public Repos` },
    { icon: icons.clock, text: `Joined GitHub ${yearsSince(stats.createdAt)} years ago` },
  ];

  const startY = 120;
  const gap = 36;
  return rows
    .map((row, i) => {
      const y = startY + i * gap;
      return `
      <g transform="translate(40, ${y})">
        <svg x="0" y="-13" width="17" height="17" viewBox="0 0 16 16" fill="${theme.icon}">${row.icon}</svg>
        <text x="30" y="0" class="stat">${escapeXml(row.text)}</text>
      </g>`;
    })
    .join("");
}

function renderChart(stats, theme) {
  const days = flattenDays(stats.calendar);
  const n = days.length;
  const maxDaily = Math.max(...days.map((d) => d.contributionCount), 1);
  const { max: yMax, step } = niceScale(maxDaily);

  const xAt = (i) => CHART_LEFT + (i / (n - 1)) * PLOT_W;
  const yAt = (v) => CHART_BOTTOM - (v / yMax) * PLOT_H;

  // Curve points.
  const pts = days.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.contributionCount).toFixed(1)}`);
  const areaPath =
    `M${CHART_LEFT},${CHART_BOTTOM} ` +
    `L${pts.join(" L")} ` +
    `L${CHART_RIGHT},${CHART_BOTTOM} Z`;
  const linePath = `M${pts.join(" L")}`;

  // Y axis: gridlines + values on the right.
  let yTicks = "";
  for (let v = 0; v <= yMax; v += step) {
    const y = yAt(v).toFixed(1);
    yTicks += `
      <line x1="${CHART_LEFT}" y1="${y}" x2="${CHART_RIGHT}" y2="${y}" stroke="${theme.text}" stroke-opacity="0.08"/>
      <text x="${CHART_RIGHT + 8}" y="${y}" dy="0.32em" class="axis">${v}</text>`;
  }

  // X axis: month markers.
  const xTicks = monthMarkers(days)
    .map(
      (m) =>
        `<text x="${xAt(m.index).toFixed(1)}" y="${CHART_BOTTOM + 20}" class="axis" text-anchor="middle">${m.label}</text>`
    )
    .join("");

  return `
    <text x="${WIDTH - 25}" y="52" class="caption" text-anchor="end">contributions in the last year</text>
    ${yTicks}
    <path d="${areaPath}" fill="${theme.chart}" fill-opacity="0.55"/>
    <path d="${linePath}" fill="none" stroke="${theme.chart}" stroke-width="2" stroke-linejoin="round"/>
    ${xTicks}`;
}

export function renderOverviewCard(stats, theme) {
  const title = stats.login;

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub stats for ${escapeXml(stats.login)}">
  <style>
    .header { font: 700 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.title}; }
    .stat { font: 400 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; }
    .caption { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; fill-opacity: 0.9; }
    .axis { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${theme.text}; fill-opacity: 0.65; }
  </style>
  <rect x="0.5" y="0.5" rx="8" width="${WIDTH - 1}" height="${HEIGHT - 1}" fill="${theme.bg}" stroke="${theme.border}" stroke-opacity="0.5"/>
  <text x="40" y="62" class="header">${escapeXml(title)}</text>
  ${renderLeftColumn(stats, theme)}
  ${renderChart(stats, theme)}
</svg>`;
}
