import { formatTime, parseFlags } from "./src/deps.ts";
import { defaultChangelog } from "./mod.ts";

const args = parseFlags(Deno.args);

if (!args._[0] || args.h || args.help) {
  console.log(`
ghlog - Generate release notes based on GitHub commits

Usage:
  ghlog <user/repo> [base_ref] [head_ref] [ ...options ]

Arguments:
  base_ref - git ref to newest commit. (default: last tag or initial commit)
  head_ref - git ref to oldest commit. (default: the latest commit)

Options:
  -h, --help                - this help menu
  -o, --output   <path>     - location of changelog output (default: CHANGELOG.md)
  -v, --version  <version>  - release tag
  -n, --name     <name>     - release name
      --auth     <token>    - GitHub access token
`);
  Deno.exit(0);
}

const repo = String(args._[0]);
const base = args._[1] ? String(args._[1]) : undefined;
const head = args._[2] ? String(args._[2]) : undefined;

const output: string = args.o ?? args.output;
const tag: string = args.v ?? args.version ?? "UNRELEASED";
const name: string = args.n ?? args.name;

const changelog = await defaultChangelog(
  { name: repo, base, head },
  { name, tag, date: formatTime(new Date(), "dd.MM.yyyy") },
);

Deno.writeTextFile(output ?? "CHANGELOG.md", changelog);
