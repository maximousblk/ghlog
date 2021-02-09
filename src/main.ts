import { getChanges, sortCommits } from "./utils.ts";

export interface Config {
  categories: {
    name: string;
    emoji: string;
    title: string;
  }[];
}

export const defaultConfig: Config = {
  categories: [
    { name: "feat", emoji: "🚀", title: "New Features" },
    { name: "fix", emoji: "🐛", title: "Bug fixes" },
    { name: "docs", emoji: "📚", title: "Documentation" },
    { name: "style", emoji: "🎨", title: "Styles" },
    { name: "refactor", emoji: "♻️", title: "Refactors" },
    { name: "perf", emoji: "💨", title: "Performance" },
    { name: "test", emoji: "🔬", title: "Tests" },
    { name: "build", emoji: "👷", title: "Builds" },
    { name: "ci", emoji: "✔️", title: "CI/CD" },
    { name: "chore", emoji: "✏️", title: "Chores" },
    { name: "revert", emoji: "⏪", title: "Reverts" },
  ],
};

export async function getChangeLog(
  repo: string,
  base?: string,
  head?: string,
  config?: Config,
) {
  const [owner, repoName] = repo.split("/");

  const configuration = Object.assign({}, defaultConfig, config);

  const { baseCommit, headCommit, commits } = await getChanges(
    owner,
    repoName,
    base,
    head,
  );

  const sortedCommits = sortCommits(
    commits,
    configuration.categories.map(({ name }) => name),
  );

  const changes: {
    name: string;
    title: string;
    emoji: string;
    count: number;
    commits: { sha: string; message: string; author: string }[];
  }[] = [];

  const authors: string[] = [];

  configuration.categories.forEach(({ name, title, emoji }) => {
    if (sortedCommits[name].length) {
      sortedCommits[name].forEach(({ author }) => authors.push(author));
      changes.push({
        name,
        title,
        emoji,
        count: sortedCommits[name].length,
        commits: sortedCommits[name],
      });
    }
  });

  const contributors = Array.from(new Set(authors));

  const _meta = {
    repo: {
      owner: owner,
      name: repoName,
      fullname: repo,
    },
    base: baseCommit,
    head: headCommit,
    commits: {
      all: commits,
      sorted: sortedCommits,
    },
    contributors,
    config: {
      default: defaultConfig,
      input: config,
    },
  };

  return {
    changes,
    _meta,
  };
}
