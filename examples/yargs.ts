import { getChangeLog } from "../src/main.ts";

const { changes } = await getChangeLog(
  "yargs/yargs",
  undefined,
  undefined,
  {
    categories: [
      { name: "feat", emoji: "", title: "Features" },
      { name: "fix", emoji: "", title: "Bug fixes" },
    ],
    contributors: {
      exclude: ["@web-flow", "@ghost"],
      includeBots: false,
    },
  },
);

const changelog = `${
  changes
    .map(({ title, commits }) => {
      const changes = commits
        .map(({ scope, subject, url, shortSha }) => {
          const Scope = scope ? `**${scope}:** ` : "";
          const Link = `([${shortSha}](${url}))`;
          return `- ${Scope}${subject} ${Link}`;
        })
        .join("\n");

      return `\n### ${title}\n\n` + changes;
    })
    .join("\n")
}
`;

Deno.writeTextFile("CHANGELOG.md", changelog);
