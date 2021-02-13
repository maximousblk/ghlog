import { getCommits, groupCommits, processCommit } from "./utils.ts";
import type { Commit } from "./utils.ts";

/**
 * Changelog configuration
 */
export interface Config {
  categories: {
    name: string;
    emoji: string;
    title: string;
  }[];
  contributors: {
    exclude: string[];
    includeBots: boolean;
  };
}

/**
 * Default changelog configuration
 */
export const defaultConfig: Config = {
  categories: [
    { name: "BREAKING", emoji: "💥", title: "Breaking Changes" },
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
  contributors: {
    exclude: ["@web-flow", "@ghost"],
    includeBots: false,
  },
};

/**
 * Get a list of grouped changes and other metadata
 * @param repo repository name in format `owner/repo`
 * @param base git ref for base commit
 * @param head git ref for head commit
 * @param config changelog configuration
 * @returns array of grouped changes
 */
export async function getChangeLog(
  repo: string,
  base?: string,
  head?: string,
  config?: Config,
) {
  const [owner, repository] = repo.split("/");

  const configuration: Config = Object.assign({}, defaultConfig, config);

  const {
    commits: rawCommits,
    base: baseCommit,
    head: headCommit,
  } = await getCommits(owner, repository, base, head);

  const commits: Commit[] = rawCommits.map((commit) => processCommit(commit));

  const filters: string[] = configuration.categories.map(({ name }) => name);

  const groups: Record<string, Commit[]> = groupCommits(commits, filters);

  const changes: {
    name: string;
    title: string;
    emoji: string;
    count: number;
    commits: Commit[];
  }[] = [];

  const allCommits: Commit[] = [];

  const authors: string[] = [];

  configuration.categories.forEach(({ name, title, emoji }) => {
    if (groups[name].length) {
      groups[name].forEach(({ author }) => authors.push(author));
      allCommits.push(...groups[name]);
      changes.push({
        name,
        title,
        emoji,
        count: groups[name].length,
        commits: groups[name],
      });
    }
  });

  const getContributors = (allContributors: string[]) => {
    const contributors = new Set(allContributors);
    if (!configuration.contributors.includeBots) {
      allContributors.forEach((contributor) => {
        if (contributor.endsWith("[bot]")) contributors.delete(contributor);
      });
    }
    configuration.contributors.exclude.forEach((contributor) => {
      contributors.delete(contributor);
    });
    return Array.from(contributors);
  };

  const _meta = {
    repo: {
      owner: owner,
      name: repository,
      fullname: repo,
    },
    commits: {
      base: processCommit(baseCommit),
      head: processCommit(headCommit),
      all: commits,
      count: commits.length,
      groups,
    },
    config: {
      default: defaultConfig,
      input: config,
      final: configuration,
    },
    contributors: getContributors(authors),
  };

  return {
    changes,
    _meta,
  };
}
