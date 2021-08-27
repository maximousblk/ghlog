/**
 * GET https://changelog.deno.dev/:user/:repo
 */

/// <reference types="https://deno.land/x/deploy@0.3.0/types/deploy.ns.d.ts" />
/// <reference types="https://deno.land/x/deploy@0.3.0/types/deploy.window.d.ts" />
/// <reference types="https://deno.land/x/deploy@0.3.0/types/deploy.fetchevent.d.ts" />

/** @jsx h */

import { h, Helmet, Router, ssr, tw } from "https://crux.land/nanossr@0.0.2";
import { URLPattern } from "https://deno.land/x/url_pattern@v1.0.0/mod.ts";
import { getChangeLog } from "../src/main.ts";
import type { Commit } from "../src/utils.ts";

const NotFound = () => (
  <div class={tw`bg-red-500 flex h-screen w-screen`}>
    <Helmet>
      <title>⛔️ 404</title>
    </Helmet>
    <h1 class={tw`text-5xl text-white m-auto`}>404 - Not Found</h1>
  </div>
);

interface Change {
  name: string;
  title: string;
  emoji: string;
  count: number;
  commits: Commit[];
}

interface Meta {
  head: string;
  base: string;
}

const getChanges = async (
  repo: string,
): Promise<{ changes: Change[]; meta: Meta; error: string | null }> => {
  try {
    const { changes, _meta } = await getChangeLog(repo);
    return {
      changes,
      meta: {
        head: _meta.commits.head.shortSha.toUpperCase(),
        base: _meta.commits.base.shortSha.toUpperCase(),
      },
      error: null,
    };
  } catch (e) {
    return { changes: [], meta: { head: "", base: "" }, error: e.message };
  }
};

const Changelog = ({
  repo,
  commits,
  meta,
  error,
}: {
  repo: string;
  commits: Commit[];
  meta: Meta;
  error: string | null;
}) => {
  if (error) {
    console.error(error);
    return NotFound;
  }

  return (
    <div class={tw`bg-white flex h-screen`}>
      <Router.Switch fallback={NotFound}>
        <Router.Route exact path="/">
          <Helmet>
            <title>ghlog</title>
          </Helmet>
          <h1 class={tw`font-mono text-4xl text-gray-700 m-auto`}>
            GET /:user/:repo
          </h1>
        </Router.Route>

        <Router.Route exact path="/:user/:repo">
          <Helmet>
            <title>
              {repo}@{meta.base}...{meta.head}
            </title>
          </Helmet>
          <div class={tw`font-mono p-12`}>
            <h1 class={tw`text-5xl text-gray-800 font-semibold`}>
              <span class={tw`select-none mr-2`}>±</span>
              {repo}@{meta.base}...{meta.head}
            </h1>
            <ul class={tw`text-lg text-gray-700 font-medium py-8`}>
              {commits.map(({ header, shortSha }) => (
                <li>
                  <span class={tw`select-none mr-2`}>•</span>
                  [{shortSha.toUpperCase()}] {header}
                </li>
              ))}
            </ul>
          </div>
        </Router.Route>
      </Router.Switch>
    </div>
  );
};

addEventListener("fetch", async (event: FetchEvent) => {
  const { pathname } = new URL(event.request.url);

  const pattern = new URLPattern("/:user/:repo");
  const match = pattern.match(pathname);
  const repo = pathname.replace("/", "");

  const { changes, meta, error } = match
    ? await getChanges(repo)
    : { changes: [], meta: { head: "", base: "" }, error: null };
  const commits = changes.map(({ commits }) => commits).flat();

  const props = { repo, commits, meta, error };

  event.respondWith(ssr(() => <Changelog {...props} />, { pathname }));
});
