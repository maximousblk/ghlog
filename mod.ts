import { parse } from "./deps.ts";

const args = parse(Deno.args);

const GITHUB_TOKEN: string = args.auth ?? Deno.env.get("GITHUB_TOKEN");

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

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  user: string;
  labels: {
    name: string;
    description: string;
  }[];
}

export interface prlogOptions {
  tag?: string;
  markdown?: boolean;
}

export async function getCommitForTag(
  repo: string,
  tag: string,
): Promise<string> {
  const ref: { object: { sha: string } } = await fetch(
    `${API}/repos/${repo}/git/refs/tags/${tag}`,
    headers,
  ).then((res) => res.json());

  return ref.object.sha;
}

export async function getInitialCommit(repo: string): Promise<string> {
  const commits_api = await fetch(`${API}/repos/${repo}/commits`, headers);
  const last_page = commits_api.headers
    .get("link")
    ?.split(",")[1]
    .split(";")[0]
    .split("<")[1]
    .split(">")[0];

  const commits: { sha: string }[] = await commits_api.json();

  if (last_page) {
    const commit: { sha: string }[] = await fetch(last_page, headers)
      .then((res) => res.json());

    return commit[commit.length - 1].sha;
  } else {
    return commits[commits.length - 1].sha;
  }
}

export async function getLastCommit(
  repo: string,
  branch?: string,
): Promise<string> {
  const commits: { sha: string } = await fetch(
    `${API}/repos/${repo}/commits/${branch ?? "master"}`,
    headers,
  ).then((res) => res.json());

  return commits.sha;
}

export async function getLastTag(repo: string): Promise<string | undefined> {
  const tags: { name: string }[] = await fetch(
    `${API}/repos/${repo}/tags`,
    headers,
  ).then((res) => res.json());

  return tags[0] ? tags[0].name : undefined;
}

export async function getCommitsBetween(
  repo: string,
  from: string,
  to: string,
): Promise<{ sha: string; message: string }[]> {
  const compare: {
    commits: {
      sha: string;
      commit: {
        message: string;
      };
    }[];
  } = await fetch(`${API}/repos/${repo}/compare/${from}...${to}`, headers)
    .then((res) => res.json());

  const sha: { sha: string; message: string }[] = [];
  for (const commit of compare.commits) {
    sha.push({ sha: commit.sha, message: commit.commit.message });
  }
  return sha;
}

export function getPrNumber(message: string): string | undefined {
  const merge = merge_commit.exec(message);
  const squash = squash_commit.exec(message);

  if (merge) {
    return merge[1];
  } else if (squash) {
    return squash[2];
  } else {
    return undefined;
  }
}

export async function getPullRequest(
  repo: string,
  number: string,
): Promise<PullRequest> {
  const pull = await fetch(`${API}/repos/${repo}/pulls/${number}`, headers)
    .then((res) => res.json());

  const labels: { name: string; description: string }[] = [];
  for (const label of pull.labels) {
    labels.push({ name: label.name, description: label.description });
  }

  const pr: PullRequest = {
    number: pull.number,
    title: pull.title,
    body: pull.body,
    user: pull.user.login,
    labels: labels,
  };

  return pr;
}

export async function getChanges(
  repo: string,
  from?: string,
  to?: string,
  branch?: string,
): Promise<PullRequest[]> {
  const from_tag: string | undefined = from ?? await getLastTag(repo);
  const from_commit: string = from_tag
    ? await getCommitForTag(repo, from_tag)
    : await getInitialCommit(repo);

  const to_commit: string = to
    ? await getCommitForTag(repo, to)
    : await getLastCommit(repo, branch);

  const commits_between: { sha: string; message: string }[] =
    await getCommitsBetween(repo, from_commit, to_commit);

  const prs: PullRequest[] = [];

  for (const commit of commits_between) {
    const pr_number = getPrNumber(commit.message);

    if (pr_number) {
      const pull = await getPullRequest(repo, pr_number);
      prs.push(pull);
    }
  }

  return prs.sort((a, b) => {
    if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
    if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
    return 0;
  });
}

export default async function prlog(
  template: string,
  repo: string,
  from?: string,
  to?: string,
  branch?: string,
  options?: prlogOptions,
): Promise<string> {
  const changes = await getChanges(repo, from, to, branch);

  let lines: string[] = [];
  for (const change of changes) {
    const number: string = options?.markdown
      ? `[#${change.number}](${WEB}/${repo}/pull/${change.number})`
      : `#${change.number}`;

    lines.push(`- ${change.title} (${number})`);
  }

  const changelog = lines.join("\n");
  return template.replaceAll(options?.tag ?? "{{ CHANGELOG }}", changelog);
}
