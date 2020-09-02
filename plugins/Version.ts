declare global {
  interface String {
    prlogVersion(version: string, tag?: string): string;
  }
}

String.prototype.prlogVersion = function (
  version: string,
  tag?: string,
): string {
  return this.replaceAll(tag ?? "{{ VERSION }}", version);
};

export {};
