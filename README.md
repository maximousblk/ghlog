# prlog

Generate release notes based on GitHub Pull Requests

## Install

You can install prlog using the following command

```sh
deno install -A -n prlog https://deno.land/x/prlog/mod.ts
```

## Usage

```sh
prlog <owner/repo> [start_tag] [end_tag] [options]
```

- `[start_tag]` - where to start countig changes. defaults to last tag or first commit.
- `[end_tag]` - where to stop counting changes. defaults to last commit.
- `[options]`:
  - template - location of the release notes template (default: undefined)
  - output - location where to output generated release notes (default: undefined)
  - version - version to use in release notes (default: "UNRELEASED")
  - branch - name of the default branch of the repo (default: "master")
  - markdown - use CommonMark spec instead of GitHub Flavoured Markdown
  - auth - GitHub access token. Use this to avoid API rate limits and access private repositories

You can also use `GITHUB_TOKEN` environment variable to use GitHub access token

### Templates

prlog uses markdown files for templates. Just appropriate tags where you need them and that's it. If you don't define a template, prlog will output only a markdown list of pull requests.

supported tags:

- `{{ VERSION }}` - version of next release
- `{{ CHANGELOG }}` - list of merged pull requests

Example :

```md
<!-- template.md -->

### {{ VERSION }}

{{ CHANGELOG }}
```

```sh
# /bin/sh
prlog denoland/deno -v 1.3.3 -t template.md -o changelog.md
```

```md
<!-- changelog.md -->

### 1.3.3

- docs(std/fs): remove stale references to readFileStr and writeFileStr (#7254)
- Typo in zsh env setup steps (#7250)
- upgrade: rust 1.46.0 (#7251)
```

### Plugins

In addition to using the CLI, you can build your own custom plugins on top of prlog.

Example:

```ts
import { getChangelog } from "https://deno.land/x/prlog/mod.ts";
import { version, date, contributers } from "./plugin.ts";

const changelog: string = await getChangelog("denoland/deno");
const template: string = await Deno.readTextFile("./template.ts");

const release_notes: string = template
  .replaceAll("{{ CHANGELOG }}", changelog)
  .replaceAll("{{ VERSION }}", version)
  .replaceAll("{{ DATE }}", date)
  .replaceAll("{{ CONTRIBUTERS }}", contributers);

await Deno.writeTextFile("CHANGELOG.md", release_notes);
```

## License

prlog is distributed under [The MIT License](LICENSE)
