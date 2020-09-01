import { format as datetime } from "https://deno.land/std@0.67.0/datetime/mod.ts";

declare global {
  interface String {
    prlogSetDate(date?: string, format?: string, tag?: string): string;
  }
}

String.prototype.prlogSetDate = function (
  date?: string,
  format?: string,
  tag?: string,
): string {
  return String(this).replaceAll(
    tag ?? "{{ DATE }}",
    date ?? datetime(new Date(), format ?? "dd MM yyyy"),
  );
};

export {};
