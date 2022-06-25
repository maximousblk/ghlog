import { Octokit, parseCommit, parseFlags } from "./deps.ts";

/**
 * Get the GitHub API Auth Token
 * @returns GitHub API Auth Token
 */
function getGitHubToken(): string | undefined {
  return parseFlags(Deno.args ?? []).auth ?? Deno.env.get("GITHUB_TOKEN");
}

/**
 * Minimal commit info fetched from the GitHub API
 */
export interface RawCommit {
  sha: string;
  url: string;
  author: string;
  message: string;
}

/**
 * Detailed commit info
 */
export interface Commit {
  sha: string;
  shortSha: string;
  url: string;
  author: string;
  type?: string;
  scope?: string;
  subject?: string;
  header?: string;
  body?: string;
  message: string;
}

const octokit = new Octokit({ auth: getGitHubToken() });

/**
 * Get commit hash for a given tag
 * @param owner username of repo owner
 * @param repo repo name
 * @param tag tag which you want commit sha of
 * @returns commit hash
 */
export async function getTagCommit(
  owner: string,
  repo: string,
  tag: string,
): Promise<string> {
  const { data: tagRef } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/refs/tags/{tag}",
    {
      owner,
      repo,
      tag,
    },
  );

  if (tagRef.object.type == "commit") return tagRef.object.sha;

  const { data: tagDetails } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/tags/{tag}",
    {
      owner,
      repo,
      tag: tagRef.object.sha,
    },
  );
  return tagDetails.object.sha;
}

/**
 * Get the commit hash of oldest commit in a given repo
 * @param owner username of repo owner
 * @param repo repo name
 * @returns commit hash
 */
export async function getOldestCommit(
  owner: string,
  repo: string,
): Promise<string> {
  const {
    data: commits,
    headers: { link },
  } = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
  });

  const [, lastPage] = /page=([0-9]+)>; rel="last"/.exec(link) ?? [];

  if (lastPage) {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner,
        repo,
        page: lastPage,
      },
    );
    return data[data.length - 1].sha;
  } else {
    return commits[commits.length - 1].sha;
  }
}

/**
 * Get commit hash of the newest commit in a given repo
 * @param owner username of repo owner
 * @param repo repo name
 * @returns commit hash
 */
export async function getNewestCommit(
  owner: string,
  repo: string,
): Promise<string> {
  const { data } = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
  });

  return data[0].sha;
}

/**
 * Get name of the newest tag in a given repo
 * @param owner username of repo owner
 * @param repo repo name
 * @returns tag name
 */
export async function getLatestTag(
  owner: string,
  repo: string,
): Promise<string | undefined> {
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/releases/latest",
      {
        owner,
        repo,
      },
    );

    return data?.tag_name;
  } catch (e) {
    return undefined;
  }
}

/**
 * Get an array of commits in a range for a given repo
 * @param owner username of repo owner
 * @param repo repo name
 * @param base commit hash of base commit
 * @param head commit hash of head commit
 * @returns array of commits
 */
export async function getCommits(
  owner: string,
  repo: string,
  base?: string,
  head?: string,
): Promise<{
  head: RawCommit;
  base: RawCommit;
  commits: RawCommit[];
}> {
  const isCommitHash = (ref: string) => {
    const shortHashExp = /([a-f0-9]{7})/;
    const longHashExp = /([a-f0-9]{40})/;
    return shortHashExp.test(ref) || longHashExp.test(ref);
  };

  const baseRef: string | undefined = base ?? (await getLatestTag(owner, repo));

  const baseCommit: string = baseRef && isCommitHash(baseRef)
    ? baseRef
    : baseRef
    ? await getTagCommit(owner, repo, baseRef)
    : await getOldestCommit(owner, repo);

  const headCommit: string = head && isCommitHash(head)
    ? head
    : head
    ? await getTagCommit(owner, repo, head)
    : await getNewestCommit(owner, repo);

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/compare/{base}...{head}",
    {
      owner,
      repo,
      base: baseCommit,
      head: headCommit,
    },
  );

  const commits: RawCommit[] = [];

  // deno-lint-ignore no-explicit-any
  const getCommitAuthor = (commit: any): string => {
    if (commit.author) {
      return "@" + commit.author.login;
    } else if (commit.committer) {
      return "@" + commit.committer.login;
    } else if (commit.commit) {
      if (commit.commit.author) {
        return commit.commit.author.name;
      } else if (commit.commit.committer) {
        return commit.commit.committer.name;
      }
    }

    return "@ghost";
  };

  for (const commit of data.commits) {
    commits.push({
      sha: commit.sha,
      url: commit.html_url,
      message: commit.commit.message,
      author: getCommitAuthor(commit),
    });
  }

  const _base = {
    sha: data.base_commit.sha,
    url: data.base_commit.html_url,
    message: data.base_commit.commit.message,
    author: getCommitAuthor(data.base_commit),
  };

  return {
    base: _base,
    head: commits[commits.length - 1] ?? _base,
    commits,
  };
}

/**
 * Extract metadata from `RawCommit` message
 * @param commits `RawCommit`
 * @returns `Commit` with extended metadata
 */
export function processCommit(commit: RawCommit): Commit {
  const { sha, message, author, url } = commit;
  const parsedCommit = parseCommit(message);

  const commitDetails: Commit = {
    sha,
    shortSha: sha.substring(0, 7),
    url,
    author,
    type: parsedCommit.type ?? undefined,
    scope: parsedCommit.scope ?? undefined,
    subject: parsedCommit.subject ?? undefined,
    header: parsedCommit.header ?? undefined,
    body: parsedCommit.body ?? undefined,
    message,
  };

  return commitDetails;
}

/**
 * Group `Commit`s together based on types
 * @param commits array of `Commit`s
 * @param filters array of filters to group commits
 * @returns array of groups of `Commit`s
 */
export function groupCommits(commits: Commit[], filters: string[]) {
  const grouped: Record<string, Commit[]> = { _misc: [] };

  filters.forEach((filter) => {
    grouped[filter] = [];
  });

  commits
    .slice()
    .sort((a, b) => {
      if (a.message.toLowerCase() < b.message.toLowerCase()) return -1;
      if (a.message.toLowerCase() > b.message.toLowerCase()) return 1;
      return 0;
    })
    .forEach((commit) => {
      if (commit.type && filters.includes(commit.type)) {
        grouped[commit.type].push(commit);
      } else {
        grouped._misc.push(commit);
      }
    });

  return grouped;
}

export async function getNewTag(
  owner: string,
  repo: string,
  groups: Record<string, Commit[]>,
): Promise<string | undefined> {
  const baseTag = await getLatestTag(owner, repo) ?? "v0.0.0";

  const semver = parseSemver(baseTag);

  if (!semver) return undefined;

  const { prefix, major, minor, patch } = semver;

  const keys = Object.keys(groups).filter((key) => groups[key].length);

  if (keys.includes("BREAKING")) {
    if (major > 0) return `${prefix}${major + 1}.0.0`;
    else return `${prefix}${major}.${minor + 1}.0`;
  }
  if (keys.includes("feat")) return `${prefix}${major}.${minor + 1}.0`;
  if (keys.includes("fix")) return `${prefix}${major}.${minor}.${patch + 1}`;

  return "UNRELEASED";
}

export function parseSemver(tag: string): {
  prefix: "v" | "";
  major: number;
  minor: number;
  patch: number;
} | undefined {
  const matched = tag.match(/^(v?)(\d+)\.(\d+)\.(\d+)$/);

  if (!matched || matched.length !== 5) return undefined;
  if (matched[1] !== "v" && matched[1] !== "") return undefined;

  return {
    prefix: matched[1],
    major: parseInt(matched[2]),
    minor: parseInt(matched[3]),
    patch: parseInt(matched[4]),
  };
}
