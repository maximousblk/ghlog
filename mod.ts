export { getChangeLog } from "./src/main.ts";
export type { Config } from "./src/main.ts";

import { getChangeLog } from "./src/main.ts";
import type { Config } from "./src/main.ts";
import { formatTime } from "./src/deps.ts";

export async function getDefaultChangelog(
  repo: {
    name: string;
    base?: string;
    head?: string;
  },
  release?: {
    tag?: string;
    name?: string;
    date?: string;
  },
  config?: Config,
): Promise<string> {
  const { _meta, changes } = await getChangeLog(
    repo.name,
    repo.base,
    repo.head,
    config,
  );

  const title = release?.name ? `# ${release?.name}\n\n` : "";

  const counts = changes.map(({ emoji, count }) => `\`${emoji} ${count}\``);

  const stats = [
    `\`📆 ${release?.date ?? formatTime(new Date(), "dd.MM.yyyy")}\``,
    `\`🏷️ ${release?.tag ?? "UNRELEASED"}\``,
    `\`💾 ${_meta.commits.head.shortSha.toUpperCase()}\``,
    `${counts.join(" ")}`,
    `\`👥 ${_meta.contributors.length}\``,
  ].join(" ");

  return `${title}${stats}
${
    changes.length
      ? changes
        .map(({ emoji, title, commits }) => {
          const header = `## ${emoji} ${title}`;
          const changes = commits
            .map(({ shortSha, url, header, author }) => {
              return `- [\`${shortSha.toUpperCase()}\`](${url}) ${header} (${author})`;
            })
            .join("\n");
          return `\n${header}\n\n${changes}`;
        })
        .join("\n")
      : "\nNo changes"
  }

## 👥 Contributors

${_meta.contributors.map((name) => `- ${name}`).join("\n") || "No contributors"}
`;
}
