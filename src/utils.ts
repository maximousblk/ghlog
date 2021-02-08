import { Octokit, parseCommit, parseFlags } from "./deps.ts";

const GITHUB_TOKEN: string = parseFlags(Deno.args).auth ??
  Deno.env.get("GITHUB_TOKEN");

export async function sleep(interval: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, interval);
  });
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

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

export async function getNewestTag(
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

export async function getCommitsBetween(
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<{ sha: string; message: string; author: string }[]> {
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/compare/{base}...{head}",
    {
      owner,
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
  owner: string,
  repo: string,
  base?: string,
  head?: string,
): Promise<
  {
    baseCommit: string;
    headCommit: string;
    commits: {
      sha: string;
      message: string;
      author: string;
    }[];
  }
> {
  const isCommitHash = (ref: string) => {
    const shortHashExp = /([a-f0-9]{7})/;
    const longHashExp = /([a-f0-9]{40})/;
    return shortHashExp.test(ref) || longHashExp.test(ref);
  };

  const baseRef: string | undefined = base ?? (await getNewestTag(owner, repo));

  const baseCommit: string = baseRef && isCommitHash(baseRef)
    ? baseRef
    : baseRef
    ? await getTagCommit(owner, repo, baseRef)
    : await getOldestCommit(owner, repo);

  const headCommit: string = head
    ? await getTagCommit(owner, repo, head)
    : await getNewestCommit(owner, repo);

  const commitsBetween = await getCommitsBetween(
    owner,
    repo,
    baseCommit,
    headCommit,
  );

  return {
    baseCommit,
    headCommit,
    commits: commitsBetween,
  };
}

export function sortCommits(
  commits: { sha: string; message: string; author: string }[],
  filters: string[],
) {
  const sorted: Record<
    string,
    { sha: string; message: string; author: string }[]
  > = {
    _misc: [],
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
      const parsedCommit = parseCommit(commit.message);

      if (
        parsedCommit.type &&
        filters.includes(parsedCommit?.type) &&
        parsedCommit.header
      ) {
        sorted[parsedCommit.type].push({
          sha: commit.sha,
          message: parsedCommit.header,
          author: commit.author,
        });
      } else {
        sorted._misc.push(commit);
      }
    });

  return sorted;
}
