# ghlog

Generate release notes based on GitHub Commits and Pull Requests

## Install

You can install ghlog using the following command.

```sh
deno install -A https://deno.land/x/ghlog/ghlog.ts
```

## Usage

```sh
ghlog <user/repo> [ ...arguments ] [ ...options ]
```

#### Arguments

| argument     | description                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `[base_ref]` | where to start counting changes. Defaults to last tag or initial commit. |
| `[head_ref]` | where to stop counting changes. Defaults to the latest commit.           |

#### Options

| option          | description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `-h, --help`    | show help                                                         |
| `-o, --output`  | location where to output release notes (default: `CHANGELOG.md`)  |
| `-v, --version` | version to use in release notes (default: "UNRELEASED")           |
| `--auth`        | Use this to avoid API rate limits and access private repositories |

You can also use the `GITHUB_TOKEN` environment variable to use the GitHub
access token.

## Templates

ghlog provides a default template out of the box, but if you want more custom template, you can use [`mod.ts`](./mod.ts) as a reference and create your own templates.

## License

This software is released under [The MIT License](LICENSE)
