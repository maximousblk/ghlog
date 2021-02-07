import { Octokit, parseCommit, parseFlags } from "./deps.ts";
import type { Commit } from "./deps.ts";

const GITHUB_TOKEN: string = parseFlags(Deno.args).auth ??
  Deno.env.get("GITHUB_TOKEN");

export async function sleep(interval: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, interval);
  });
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function getTagCommit(
  user: string,
  repo: string,
  tag: string,
): Promise<string> {
  const { data: tagRef } = await octokit.request(
    "GET /repos/{user}/{repo}/git/refs/tags/{tag}",
    {
      user,
      repo,
      tag,
    },
  );

  if (tagRef.object.type == "commit") return tagRef.object.sha;

  const { data: tagDetails } = await octokit.request(
    "GET /repos/{user}/{repo}/git/tags/{tag}",
    {
      user,
      repo,
      tag: tagRef.object.sha,
    },
  );
  return tagDetails.object.sha;
}

export async function getOldestCommit(
  user: string,
  repo: string,
): Promise<string> {
  const {
    data: commits,
    headers: { link },
  } = await octokit.request("GET /repos/{user}/{repo}/commits", {
    user,
    repo,
  });

  const [, lastPage] = /page=([0-9]+)>; rel="last"/.exec(link) ?? [];

  if (lastPage) {
    const { data } = await octokit.request("GET /repos/{user}/{repo}/commits", {
      user,
      repo,
      page: lastPage,
    });
    return data[data.length - 1].sha;
  } else {
    return commits[commits.length - 1].sha;
  }
}

export async function getNewestCommit(
  user: string,
  repo: string,
): Promise<string> {
  const { data } = await octokit.request("GET /repos/{user}/{repo}/commits", {
    user,
    repo,
  });

  return data[0].sha;
}

export async function getNewestTag(
  user: string,
  repo: string,
): Promise<string | undefined> {
  try {
    const { data } = await octokit.request(
      "GET /repos/{user}/{repo}/releases/latest",
      {
        user,
        repo,
      },
    );

    return data?.tag_name;
  } catch (e) {
    return undefined;
  }
}

export async function getCommitsBetween(
  user: string,
  repo: string,
  base: string,
  head: string,
): Promise<{ sha: string; message: string; author: string }[]> {
  const { data } = await octokit.request(
    "GET /repos/{user}/{repo}/compare/{base}...{head}",
    {
      user,
      repo,
      base,
      head,
    },
  );

  const commits: { sha: string; message: string; author: string }[] = [];
  for (const commit of data.commits) {
    commits.push({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author
        ? "@" + commit.author.login
        : commit.committer
        ? "@" + commit.committer.login
        : commit.commit
        ? commit.commit.author
          ? commit.commit.author.name
          : commit.commit.committer.name
        : "@ghost",
    });
  }
  return commits;
}

export async function getChanges(
  user: string,
  repo: string,
  base?: string,
  head?: string,
): Promise<
  {
    sha: string;
    message: string;
    author: string;
  }[]
> {
  const fromTag: string | undefined = base ?? (await getNewestTag(user, repo));

  const fromCommit: string = fromTag
    ? await getTagCommit(user, repo, fromTag)
    : await getOldestCommit(user, repo);

  const toCommit: string = head
    ? await getTagCommit(user, repo, head)
    : await getNewestCommit(user, repo);

  const commitsBetween = await getCommitsBetween(
    user,
    repo,
    fromCommit,
    toCommit,
  );

  return commitsBetween;
}

export function sortCommits(
  commits: { sha: string; message: string; author: string }[],
  filters: string[],
) {
  const sorted: Record<
    string,
    { sha: string; message: string; author: string }[]
  > = {
    _unsorted: [],
  };

  filters.forEach((filter) => {
    sorted[filter] = [];
  });

  commits
    .sort((a, b) => {
      if (a.message.toLowerCase() < b.message.toLowerCase()) return -1;
      if (a.message.toLowerCase() > b.message.toLowerCase()) return 1;
      return 0;
    })
    .forEach((commit) => {
      const parsedCommit: Commit = parseCommit(commit.message);

      if (parsedCommit.type && filters.includes(parsedCommit.type)) {
        sorted[parsedCommit.type].push({
          sha: commit.sha,
          message: parsedCommit.header || "",
          author: commit.author,
        });
      } else {
        sorted._unsorted.push(commit);
      }
    });

  return sorted;
}
