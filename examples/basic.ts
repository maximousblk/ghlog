import { getChangeLog } from "../src/main.ts";

const { _meta } = await getChangeLog("denoland/deno");

const changelog = `## CHANGELOG

${_meta.commits.all.map(({ header }) => `- ${header}`).join("\n")}
`;

Deno.writeTextFile("CHANGELOG.md", changelog);
