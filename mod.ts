export { getChangeLog } from "./src/main.ts";
export type { Config } from "./src/main.ts";
import { getChangeLog } from "./src/main.ts";
import type { Config } from "./src/main.ts";

export async function defaultChangelog(
  repo: { name: string; base?: string; head?: string },
  release: {
    name?: string;
    tag: string;
    date: string;
  },
  config?: Config,
): Promise<string> {
  const changelog = await getChangeLog(repo.name, repo.base, repo.head, config);

  const title = release.name ? `# ${release.name}\n` : "";

  const stats = Object.entries(changelog.changes)
    .map(([, main]) => `\`${main.emoji} ${main.count}\``)
    .join(" ");

  const metadata = [
    `\`📆 ${release.date}\``,
    `\`🏷️ ${release.tag}\``,
    `\`💾 ${changelog.newestCommit.substring(0, 7)}\``,
    `\`👥 ${changelog.authors.size}\``,
    stats,
  ].join(" ");

  return `${title}${metadata}
${
    Object.entries(changelog.changes)
      .map(([, change]) => {
        const title = `\n## ${change.emoji} ${change.title}\n\n`;
        const changes = change.commits
          .map((commit) => {
            return `- [\`${
              commit.sha.substring(0, 7)
            }\`](https://github.com/${repo.name}/commit/${commit.sha}) ${commit.message} (${commit.author})`;
          })
          .join("\n");

        return title + changes;
      })
      .join("\n")
  }

## 👥 Contributors

${
    Array.from(changelog.authors)
      .map((commiter) => `- ${commiter}`)
      .join("\n")
  }
`;
}
