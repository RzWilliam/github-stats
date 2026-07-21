// Entry point: fetch the stats and write the SVG into generated/.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { collectStats } from "./github.mjs";
import { getTheme } from "./theme.mjs";
import { formatNumber } from "./svg.mjs";
import { renderOverviewCard } from "./cards/overview.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "generated");

async function main() {
  const login = process.env.GH_USERNAME || "RzWilliam";
  const themeName = process.env.GH_THEME || "radical";
  const theme = getTheme(themeName);

  console.log(`→ Fetching stats for @${login} (theme: ${themeName})…`);
  const stats = await collectStats(login);

  console.log(
    `  ${formatNumber(stats.totalContributions)} contributions · ` +
      `${stats.totalStars} ⭐ · ${stats.repos} repos`
  );

  const cards = {
    "overview.svg": renderOverviewCard(stats, theme),
  };

  await mkdir(OUT_DIR, { recursive: true });
  for (const [file, svg] of Object.entries(cards)) {
    await writeFile(resolve(OUT_DIR, file), svg, "utf8");
    console.log(`  ✓ generated/${file}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("✗ Failed:", err.message);
  process.exit(1);
});
