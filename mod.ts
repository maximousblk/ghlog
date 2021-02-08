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
  const changelog = await getChangeLog(repo.name, repo.base, repo.head, config);

  const title = release?.name ? `# ${release?.name}\n\n` : "";

  const counts = changelog.changes
    .map(({ emoji, count }) => `\`${emoji} ${count}\``)
    .join(" ");

  const stats = [
    `\`📆 ${release?.date ?? formatTime(new Date(), "dd.MM.yyyy")}\``,
    `\`🏷️ ${release?.tag ?? "UNRELEASED"}\``,
    `\`💾 ${changelog._meta.head.substring(0, 7)}\``,
    counts,
    `\`👥 ${changelog._meta.contributors.length}\``,
  ].join(" ");

  return `${title}${stats}
${
    changelog.changes
      .map(({ emoji, title, commits }) => {
        const changes = commits
          .map((commit) => {
            return `- [\`${
              commit.sha.substring(0, 7)
            }\`](https://github.com/${repo.name}/commit/${commit.sha}) ${commit.message} (${commit.author})`;
          })
          .join("\n");

        return `\n## ${emoji} ${title}\n\n` + changes;
      })
      .join("\n")
  }

## 👥 Contributors

${changelog._meta.contributors.map((name) => `- ${name}`).join("\n")}
`;
}
