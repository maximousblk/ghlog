import { getChanges, getNewestCommit, sortCommits } from "./utils.ts";

export interface Config {
  categories: {
    name: string;
    emoji: string;
    title: string;
  }[];
}

const defaultConfig: Config = {
  categories: [
    {
      name: "feat",
      emoji: "🚀",
      title: "New Features",
    },
    {
      name: "fix",
      emoji: "🐛",
      title: "Bug fixes",
    },
    {
      name: "docs",
      emoji: "📄",
      title: "Documentation",
    },
    {
      name: "chore",
      emoji: "✏️",
      title: "Chores",
    },
  ],
};

export async function getChangeLog(
  repository: string,
  base?: string,
  head?: string,
  configuration?: Config,
) {
  const [user, repo] = repository.split("/");

  const config = Object.assign({}, defaultConfig, configuration);

  const allCommits = await getChanges(user, repo, base, head);

  const sortedcommits = sortCommits(
    allCommits,
    config.categories.map(({ name }) => name),
  );

  const changes: Record<
    string,
    {
      name: string;
      title: string;
      emoji: string;
      count: number;
      commits: { sha: string; message: string; author: string }[];
    }
  > = {};

  const commitAuthors: string[] = [];

  config.categories.forEach(({ name, title, emoji }) => {
    if (sortedcommits[name].length) {
      sortedcommits[name].forEach((commit) =>
        commitAuthors.push(commit.author)
      );
      changes[name] = {
        name,
        title,
        emoji,
        count: sortedcommits[name].length,
        commits: sortedcommits[name].map((commit) => commit),
      };
    }
  });

  const newestCommit = await getNewestCommit(user, repo);

  const authors = new Set(commitAuthors);

  return {
    changes,
    authors,
    allCommits,
    newestCommit,
    sortedcommits,
  };
}
