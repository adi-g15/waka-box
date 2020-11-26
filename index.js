require("dotenv").config();
const { WakaTimeClient, RANGE } = require("wakatime-client");
const Octokit = require("@octokit/rest");
const { program } = require("commander");
const { readConfigFile } = require("./lib/config");

const {
  GIST_ID: gistId,
  GH_TOKEN: githubToken,
  WAKATIME_API_KEY: wakatimeApiKey
} = process.env;

const wakatime = new WakaTimeClient(wakatimeApiKey);

const octokit = new Octokit({ auth: `token ${githubToken}` });

const argv = process.argv.slice(0, 2).concat(readConfigFile("config")).concat(process.argv.slice(2));
program
  .version(require("./package.json").version)
  .option(
    "--format [FORMAT]",
    "Control duration format. FORMAT can be 'short' or 'long'.",
    "long"
  )
  .option("--include-percent", "Include a percentage after each bar.", false)
  .option("--dry", "Print to stdout instead of uploading a gist.", false)
  .parse(argv);

async function main() {
  const stats = await wakatime.getMyStats({ range: RANGE.LAST_7_DAYS });
  await updateGist(stats);
}

async function updateGist(stats) {
  let gist;
  try {
    gist = await octokit.gists.get({ gist_id: gistId });
  } catch (error) {
    console.error(`Unable to get gist\n${error}`);
  }

  const lines = [];
  for (let i = 0; i < Math.min(stats.data.languages.length, 5); i++) {
    const data = stats.data.languages[i];
    const { name, percent } = data;

    let timeText;
    if (program.format === "short") {
      timeText = formatDuration(data.hours, data.minutes).padStart(8);
    } else {
      timeText = data.text.padEnd(14);
    }

    const line = [
      name.padEnd(11),
      timeText,
      generateBarChart(percent, 21),
      ... program.includePercent ? [String(percent.toFixed(1)).padStart(5) + "%"] : [],
    ];
    lines.push(line.join(" "));
  }

  if (lines.length == 0) return;
  const content = lines.join("\n");

  if (program.dry) {
    process.stdout.write(content);
    process.stdout.write("\n");
  } else {
    try {
      // Get original filename to update that same file
      const filename = Object.keys(gist.data.files)[0];
      await octokit.gists.update({
        gist_id: gistId,
        files: {
          [filename]: {
            filename: `📊 Weekly development breakdown`,
            content
          }
        }
      });
    } catch (error) {
      console.error(`Unable to update gist\n${error}`);
    }
  }
}

function generateBarChart(percent, size) {
  const syms = "░▏▎▍▌▋▊▉█";

  const frac = Math.floor((size * 8 * percent) / 100);
  const barsFull = Math.floor(frac / 8);
  if (barsFull >= size) {
    return syms.substring(8, 9).repeat(size);
  }
  const semi = frac % 8;

  return [syms.substring(8, 9).repeat(barsFull), syms.substring(semi, semi + 1)]
    .join("")
    .padEnd(size, syms.substring(0, 1));
}

function formatDuration(h, m) {
  if (h > 0) {
    return `${String(h).padStart(2)}h ${String(m).padStart(2)}m`;
  } else {
    return `${String(m).padStart(6)}m`;
  }
}

(async () => {
  await main();
})();
