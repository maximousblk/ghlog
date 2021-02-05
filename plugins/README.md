# prlog plugins

prlog plugins are extentions for `String` prototype that can be chained
together.

> **NOTE:** It is recommended that you prefix your plugin name with `prlog` or
> any desired identifier to avoid confusion.

example:

```ts
// MyPlugin.ts
declare global {
  interface String {
    prlogMyPlugin(): string;
  }
}

String.prototype.prlogMyPlugin = function (): string {
  return this.replaceAll("{{ MYTAG }}", "Best Plugin Ever!");
};

export {};
```

To use a plugin, just import the plugin file and it will be globally available
on every string

```ts
// release.ts
import prlog from "https://deno.land/x/prlog/mod.ts";
import "./MyPlugin.ts";

const template: string = `
{{ MYTAG }}

{{ CHANGELOG }}
`;

console.log((await prlog(template, "username/repo")).prlogMyPlugin());

/*
Best Plugin Ever!

- pull request 1 (#1)
- pull request 2 (#2)
*/
```

## Official Plugins

#### Version

```ts
import "https://deno.land/x/prlog/plugins/Version.ts";

String().prlogVersion(version: string, tag?: string): string
```

**tag:** `{{ VERSION }}`

**paremeters:**

- `version` - Version to use
- `tag?` - Optional custom tag

#### SetDate

```ts
import "https://deno.land/x/prlog/plugins/SetDate.ts";

String().prlogSetDate(date?: string, format?: string, tag?: string): string
```

**tag:** `{{ DATE }}`

**paremeters:**

- `date?` - Optional date. Defauts to current date
- `format?` - Optional date format. Defaults to `dd MM yyyy`.
  [more info](https://deno.land/std@0.67.0/datetime#usage)
- `tag?` - Optional custom tag

#### CodeName

```ts
import "https://deno.land/x/prlog/plugins/CodeName.ts";

String().prlogCodeName(codename: string, tag?: string): string
```

**tag:** `{{ CODENAME }}`

**paremeters:**

- `codename` - Release codename
- `tag?` - Optional custom tag
