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
ghlog <user/repo> [ ...arguments ] [ ...options ]
```

#### Arguments

| argument     | description                                                     |
| ------------ | --------------------------------------------------------------- |
| `[base_ref]` | git ref to newest commit. (default: last tag or initial commit) |
| `[head_ref]` | git ref to oldest commit. (default: the latest commit)          |

#### Options

| option          | description                                                |
| --------------- | ---------------------------------------------------------- |
| `-h, --help`    | show help                                                  |
| `-o, --output`  | location to release notes output (default: `CHANGELOG.md`) |
| `-v, --version` | tag to use in release notes (default: "UNRELEASED")        |
| `-n, --name`    | name to use in release notes                               |
| `--auth`        | use this to avoid API rate limits and access private repos |

You can also use the `GITHUB_TOKEN` environment variable to use the GitHub
access token.

## Templates

`ghlog` provides a sane default template out of the box, but if you want more
custom template, you can use the `defaultChangelog()` function in
[`mod.ts`](./mod.ts#L6-L56) as a reference and create your own templates.

## License

This software is released under [The MIT License](LICENSE)
