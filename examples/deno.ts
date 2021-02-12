import { formatTime } from "../src/deps.ts";
import { getChangeLog } from "../src/main.ts";

const { _meta } = await getChangeLog("denoland/deno");

const commits = _meta.commits.all
  .slice()
  .sort((a, b) => {
    if (a.message.toLowerCase() < b.message.toLowerCase()) return -1;
    if (a.message.toLowerCase() > b.message.toLowerCase()) return 1;
    return 0;
  })
  .map(({ header }) => `- ${header}`)
  .join("\n");

const version = Deno.args[0];
const date = formatTime(new Date(), "yyyy.MM.dd");

const changelog = `### ${version} / ${date}

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
