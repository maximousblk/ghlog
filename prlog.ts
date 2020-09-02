import { parse, Args } from "./deps.ts";
import prlog, { } from "./mod.ts";
import "./plugins/Version.ts";

const args: Args = parse(Deno.args);

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
  -a, --append      - append the new changelog instead of overwriting
      --auth        - GitHub access token
`);
  Deno.exit(0);
}

const repo: string = String(args._[0]);
const from = args._[1] ? String(args._[1]) : undefined;
const to = args._[2] ? String(args._[2]) : undefined;

const template_file: string = (args.t ?? args.template);
const output: string = args.o ?? args.output;
const version: string = args.v ?? args.version;
const branch: string = args.b ?? args.branch;
const markdown: boolean = args.m ?? args.markdown;
const append: boolean = args.a ?? args.append;

const template: string = template_file
  ? await Deno.readTextFile(template_file)
  : "{{ CHANGELOG }}";

const changelog: string =
  (await prlog(template, repo, from, to, branch, { markdown: markdown }))
    .prlogVersion(version ?? "UNRELEASED");

if (output && append) {
  const old: string = await Deno.readTextFile(output);
  await Deno.writeTextFile(output + old, changelog);
} else if (output && !append) {
  await Deno.writeTextFile(output, changelog);
}

console.log(changelog);
