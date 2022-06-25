# ghlog

Generate release notes based on GitHub Commits.

`ghlog` categorises the commits based on
[Conventional Commits](https://www.conventionalcommits.org). All the commits
that don't follow the CC patern are not considered.

try it now:

```
deno run -A https://deno.land/x/ghlog/ghlog.ts nestdotland/nest
```

## Install

You can install `ghlog` using the following command.

```sh
deno install -A https://deno.land/x/ghlog/ghlog.ts
```

## Usage

```sh
ghlog <owner/repo> [ ...arguments ] [ ...options ]
```

#### Arguments

| argument     | default                    | description               |
| ------------ | -------------------------- | ------------------------- |
| `[base_ref]` | last tag or initial commit | git ref to newest commit. |
| `[head_ref]` | the latest commit          | git ref to oldest commit. |

#### Options

| option          | default        | description                              |
| --------------- | -------------- | ---------------------------------------- |
| `-h, --help`    |                | show help                                |
| `-o, --output`  | `CHANGELOG.md` | location to release notes output         |
| `-v, --version` | `UNRELEASED`   | tag to use in release notes              |
| `-s, --semver`  |                | use the next semver for a new tag        |
| `-d, --date`    | current date   | release date                             |
| `-n, --name`    |                | name to use in release notes             |
| `-a, --append`  |                | append to existing changelog             |
| `--auth`        |                | GitHub access token to avoid rate limits |

You can also use the `GITHUB_TOKEN` environment variable to use the GitHub
access token.

##### Specification of -s, --semver

- When commits includes "BREAKING", increase
  - the major version if the last tag >= v1.0.0 (e.g. v1.2.3 -> v2.0.0)
  - the minor version if the last tag < v1.0.0 (e.g. v0.1.2 -> v0.2.0)
- When commits includes "feat", increase the minor version
- When commits includes "fix", increase the patch version (e.g. v1.2.3 ->
  v1.2.4)
- Otherwise, the new tag will be "UNRELEASED"

The ghlog command returns the new tag:

```sh
$ ghlog maximousblk/ghlog -s
v0.3.4
```

## Templates

`ghlog` provides a sane default template out of the box that works great in most
situations, but if you want a more custom template, you can use the
[`examples/`](./examples) directory for reference and create your own templates.

## License

This software is released under [The MIT License](LICENSE)
