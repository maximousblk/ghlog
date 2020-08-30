export {
  applyTemplate,
  getChangelog,
  getChanges,
  getLastTag,
} from "./src/utils.ts";
import { args, getChangelog, applyTemplate } from "./src/utils.ts";

if (args.h || args.help) {
  console.log(`
prlog - Generate release notes based on GitHub Pull Requests

Usage:
  prlog <owner/repo> [start_tag] [end_tag] [options]

Options:
  -h, --help        - this help menu
  -t, --template    - location of template file
  -o, --output      - location of changelog output
  -v, --version     - next version
  -b, --branch      - default branch
  -m, --markdown    - use CommonMark spec instead of GFM
      --auth        - GitHub access token
`);
  Deno.exit(0);
}

const repo: string = String(args._[0]);
const start_tag = args._[1] ? String(args._[1]) : undefined;
const end_tag = args._[2] ? String(args._[2]) : undefined;

const template: string = (args.t ?? args.template)
  ? await Deno.readTextFile(args.t ?? args.template)
  : "";
const output: string = args.o ?? args.output;
const version: string = args.v ?? args.version;
const branch: string = args.b ?? args.branch;
const markdown: boolean = args.m ?? args.markdown;

const raw = await getChangelog(repo, start_tag, end_tag, branch, markdown);
const changelog = template ? applyTemplate(template, raw, version) : raw;

if (output) await Deno.writeTextFile(output, changelog);

console.log(changelog);
