import { getChangeLog } from "./src/main.ts";
import type { Config } from "./src/main.ts";

export { getChangeLog } from "./src/main.ts";

export async function defaultChangelog(
  repo: { name: string; base?: string; head?: string },
  release: {
    name: string;
    tag: string;
    date: string;
  },
  config?: Config,
): Promise<string> {
  const changelog = await getChangeLog(repo.name, repo.base, repo.head, config);

  const stats = Object.entries(changelog.changes)
    .map(([, main]) => {
      return `\`${main.emoji} ${main.count}\``;
    })
    .join(" ");

  const metadata = [
    `\`📆 ${release.date}\``,
    `\`🏷️ ${release.tag}\``,
    `\`💾 ${changelog.newestCommit.substring(0, 7)}\``,
    `\`👥 ${changelog.authors.size}\``,
    stats,
  ].join(" ");

  return `${metadata}${
    Object.entries(changelog.changes)
      .map(([, change]) => {
        const title = `\n\n## ${change.emoji} ${change.title}\n\n`;
        const changes = change.commits
          .map((commit) => {
            return `- [\`${
              commit.sha.substring(0, 7)
            }\`](https://github.com/${repo.name}/commit/${commit.sha}) ${commit.message} (@${commit.author})`;
          })
          .join("\n");

        return title + changes;
      })
      .join()
  }

## 👥 Contributors

${
    Array.from(changelog.authors)
      .map((commiter) => `- @${commiter}`)
      .join("\n")
  }
`;
}
