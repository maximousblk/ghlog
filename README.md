# ghlog

Generate release notes based on GitHub Commits and Pull Requests

## Install

You can install ghlog using the following command.

```sh
deno install -A https://deno.land/x/ghlog/ghlog.ts
```

## Usage

```sh
ghlog <owner/repo> [ ...arguments ] [ ...options ]
```

#### Arguments

| argument      | description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `[start_tag]` | where to start counting changes. Defaults to last tag or first commit. |
| `[end_tag]`   | where to stop counting changes. Defaults to the last commit.           |

#### Options

| option           | description                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| `-t, --template` | location of the release notes template (default: undefined)                            |
| `-o, --output`   | location where to output generated release notes (default: undefined)                  |
| `-v, --version`  | version to use in release notes (default: "UNRELEASED")                                |
| `-b, --branch`   | name of the default branch of the repo (default: "master")                             |
| `-m, --markdown` | use CommonMark spec instead of GitHub Flavoured Markdown                               |
| `-a, --append`   | append the out to an existing changelog instead of owerwriting it                      |
| `--auth`         | GitHub access token. Use this to avoid API rate limits and access private repositories |

You can also use the `GITHUB_TOKEN` environment variable to use the GitHub
access token.

## Templates

ghlog can use any plaintext file for templates. Just use appropriate tags where
you need them. If you don't define a template, ghlog cli will output only a
markdown list of changes.

Default tags:

- `{{ VERSION }}` - release version
- `{{ CHANGELOG }}` - list of changes

Example :

```md
<!-- template.md -->

### {{ VERSION }}

{{ CHANGELOG }}
```

```sh
# /bin/sh
ghlog denoland/deno -v 1.3.3 -t template.md -o changelog.md
```

```md
<!-- changelog.md -->

### 1.3.3

- docs(std/fs): remove stale references to readFileStr and writeFileStr (#7254)
- Typo in zsh env setup steps (#7250)
- upgrade: rust 1.46.0 (#7251)
```

### Plugins

In addition to using the CLI, you can build custom plugins for ghlog.

Official plugins:

- [Version](plugins/Version.ts) - Set the release version. tag: `{{ VERSION }}`
- [SetDate](plugins/SetDate.ts) - Set date of release in desired format. tag:
  `{{ DATE }}`
- [CodeName](plugins/CodeName.ts) - Set a code name for the release. tag:
  `{{ CODENAME }}`

View [plugins](plugins) and
[docs](https://doc.deno.land/https/deno.land/x/ghlog/mod.ts) for more info.

Example:

```ts
// release.ts
import ghlog from "https://deno.land/x/ghlog/mod.ts";
import "https://deno.land/x/ghlog/plugins/SetDate.ts";
import "https://deno.land/x/ghlog/plugins/Version.ts";

const template: string = `
# {{ VERSION }} / {{ DATE }}

{{ CHANGELOG }}
`;

const changelog: string = (await ghlog(template, "denoland/deno"))
  .ghlogSetDate().ghlogVersion("1.3.3");

console.log(changelog);

/*
$ deno run -A release.ts
### 1.3.3 / 02 09 2020

- docs(std/fs): remove stale references to readFileStr and writeFileStr (#7254)
- Typo in zsh env setup steps (#7250)
- upgrade: rust 1.46.0 (#7251)
*/
```

## License

This software is released under [The MIT License](LICENSE)
