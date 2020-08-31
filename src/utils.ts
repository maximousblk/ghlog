import { parse, Args } from "./deps.ts";

export const args: Args = parse(Deno.args);

const GITHUB_TOKEN: string = args.auth || Deno.env.get("GITHUB_TOKEN");

const headers: object = GITHUB_TOKEN
  ? {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  }
  : {};

const API: string = "https://api.github.com";
const WEB: string = "https://github.com";

const merge_commit: RegExp = /^Merge pull request #([0-9]+) from .*\n\n(.*)/;
const squash_commit: RegExp = /^(.*) \(#([0-9]+)\).*/;

async function getCommitForTag(
  repo: string,
  tag: string,
): Promise<string> {
  const tag_: { object: { sha: string } } = await fetch(
    `${API}/repos/${repo}/git/refs/tags/${tag}`,
    headers,
  )
    .then((response) => response.json());
  return tag_.object.sha;
}

async function getInitialCommit(repo: string): Promise<string> {
  const commits_api = await fetch(`${API}/repos/${repo}/commits`, headers);
  const last_page =
    commits_api.headers.get("link")?.split(",")[1].split(";")[0].split("<")[1]
      .split(">")[0];
  const commits: { sha: string }[] = await commits_api.json();

  if (last_page) {
    const first_commit: { sha: string }[] = await fetch(last_page, headers)
      .then((response) => response.json());
    return first_commit[first_commit.length - 1].sha;
  } else {
    return commits[commits.length - 1].sha;
  }
}

async function getLastCommit(
  repo: string,
  branch?: string,
): Promise<string> {
  const commits: { sha: string } = await fetch(
    `${API}/repos/${repo}/commits/${branch ?? "master"}`,
    headers,
  )
    .then((response) => response.json());
  return commits.sha;
}

export async function getLastTag(repo: string): Promise<string | undefined> {
  const tags: { name: string }[] = await fetch(
    `${API}/repos/${repo}/tags`,
    headers,
  )
    .then((response) => response.json());
  return tags[0] ? tags[0].name : undefined;
}

async function getCommitsBetween(
  repo: string,
  from: string,
  to: string,
): Promise<{ sha: string; message: string }[]> {
  const commits: {
    commits: {
      sha: string;
      commit: {
        message: string;
      };
    }[];
  } = await fetch(
    `${API}/repos/${repo}/compare/${from}...${to}`,
    headers,
  )
    .then((response) => response.json());
  let sha: { sha: string; message: string }[] = [];
  for (let commit of commits.commits) {
    sha.push({ sha: commit.sha, message: commit.commit.message });
  }
  return sha;
}

function getPrMessage(message: string): {
  title: string;
  number: string;
} | undefined {
  const merge = merge_commit.exec(message);
  const squash = squash_commit.exec(message);
  if (merge) {
    const [, number, title] = merge;
    return { number: number, title: title };
  } else if (squash) {
    const [, title, number] = squash;
    return { number: number, title: title };
  }
}

/**
 * Returns an array of pull requests between two tags
 *
 * @param repo Github repository
 * @param from Start tag
 * @param to End tag
 * @param branch Default tag
 */

export async function getChanges(
  repo: string,
  from?: string,
  to?: string,
  branch?: string,
): Promise<{ number: string; title: string }[]> {
  const from_tag: string | undefined = from ?? await getLastTag(repo);
  const from_commit: string = from_tag
    ? await getCommitForTag(repo, from_tag)
    : await getInitialCommit(repo);
  const to_commit: string = to
    ? await getCommitForTag(repo, to)
    : await getLastCommit(repo, branch);

  const commits_between: { sha: string; message: string }[] =
    await getCommitsBetween(repo, from_commit, to_commit);

  let prs: { title: string; number: string }[] = [];

  for (let commit of commits_between) {
    const pr_message = getPrMessage(commit.message);
    if (pr_message) {
      prs.push(pr_message);
    }
  }
  return prs.sort((a, b) => {
    if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
    if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
    return 0;
  });
}

/**
 * Returns auto generated changelog using GFM or CommomMark markdown spec
 *
 * @param repo Name of the GitHub repository
 * @param from Start tag
 * @param to End tag
 * @param branch Default branch
 * @param markdown Use CommonMark spec instead of GFM
 */

export async function getChangelog(
  repo: string,
  from?: string,
  to?: string,
  branch?: string,
  markdown?: boolean,
): Promise<string> {
  const changes = await getChanges(repo, from, to, branch);
  let lines: string[] = [];
  for (const change of changes) {
    lines.push(
      `- ${change.title} ${
        markdown && repo
          ? `([#${change.number}](${WEB}/${repo}/pull/${change.number}))`
          : `(#${change.number})`
      }`,
    );
  }
  return lines.join("\n");
}
