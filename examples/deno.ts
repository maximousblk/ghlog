import { formatTime } from "../src/deps.ts";
import { getChangeLog } from "../src/main.ts";

const { changes, _meta } = await getChangeLog(
  "denoland/deno",
  undefined,
  undefined,
  {
    categories: [
      { name: "BREAKING", emoji: "", title: "" },
      { name: "feat", emoji: "", title: "" },
      { name: "fix", emoji: "", title: "" },
      { name: "upgrade", emoji: "", title: "" },
    ],
    contributors: {
      exclude: ["@web-flow", "@ghost"],
      includeBots: false,
    },
  },
);

const commits = changes
  .map(({ commits }) => {
    return commits.map(({ header }) => `- ${header}`).join("\n");
  })
  .join("\n");

const version = Deno.args[0] ?? "CANARY";
const commit = _meta.commits.head.shortSha.toUpperCase();
const date = formatTime(new Date(), "yyyy.MM.dd");

const changelog = `### ${version} / ${commit} (${date})

${commits}

### Install / Upgrade

**Using Deno:**

\`\`\`sh
deno upgrade --version ${version}
\`\`\`

**With Shell:**

\`\`\`sh
curl -fsSL https://deno.land/x/install/install.sh | sh -s v${version}
\`\`\`

**With PowerShell:**

\`\`\`ps1
$v="${version}"; iwr https://deno.land/x/install/install.ps1 -useb | iex
\`\`\`
`;

Deno.writeTextFile("CHANGELOG.md", changelog);
