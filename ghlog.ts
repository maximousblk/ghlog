import { parseFlags } from "./src/deps.ts";
import { getDefaultChangelog } from "./mod.ts";

const args = parseFlags(Deno.args);

if (!args._[0] || args.h || args.help) {
  console.log(`
ghlog - Generate release notes based on GitHub commits

Usage:
  ghlog <owner/repo> [base_ref] [head_ref] [ ...options ]

Arguments:
  base_ref - git ref to newest commit. (default: last tag or initial commit)
  head_ref - git ref to oldest commit. (default: the latest commit)

Options:
  -h, --help                - this help menu
  -o, --output   <path>     - location of changelog output (default: CHANGELOG.md)
  -v, --version  <version>  - release tag
  -n, --name     <name>     - release name
  -d, --date     <date>     - release date
  -a, --append              - append to existing changelog
      --auth     <token>    - GitHub access token
`);
  Deno.exit(0);
}

const repo = String(args._[0]);
const base = args._[1] ? String(args._[1]) : undefined;
const head = args._[2] ? String(args._[2]) : undefined;

const output: string = args.o ?? args.output ?? "CHANGELOG.md";
const tag: string = args.v ?? args.version;
const name: string = args.n ?? args.name;
const date: string = args.d ?? args.date;
const append: boolean = args.a ?? args.append;

const changelog = await getDefaultChangelog(
  { name: repo, base, head },
  { name, tag, date },
);

if (append) {
  const oldChangelog = await Deno.readTextFile(output).catch((e) => "");
  Deno.writeTextFile(output, changelog + "\n" + oldChangelog);
} else {
  Deno.writeTextFile(output, changelog);
}
