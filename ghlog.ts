import { formatTime, parseFlags } from "./src/deps.ts";
import { defaultChangelog } from "./mod.ts";

const args = parseFlags(Deno.args);

if (args.h || args.help) {
  console.log(`
ghlog - Generate release notes based on GitHub commits
Usage:
  ghlog <owner/repo> [base_ref] [head_ref] [options]

Options:
  -h, --help                - this help menu
  -o, --output   <path>     - location of changelog output (default: CHANGELOG.md)
  -v, --version  <version>  - release version
      --auth     <token>    - GitHub access token
`);
  Deno.exit(0);
}

const repo = String(args._[0]);
const base = args._[1] ? String(args._[1]) : undefined;
const head = args._[2] ? String(args._[2]) : undefined;

const output: string = args.o ?? args.output;
const version: string = args.v ?? args.version ?? "UNRELEASED";

const myChangelog = await defaultChangelog(
  { name: repo, base, head },
  {
    name: version,
    tag: version,
    date: formatTime(new Date(), "dd.MM.yyyy"),
  },
);

Deno.writeTextFile(output ?? "CHANGELOG.md", myChangelog);
