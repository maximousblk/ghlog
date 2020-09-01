declare global {
  interface String {
    prlogCodeName(codename: string, tag?: string): string;
  }
}

String.prototype.prlogCodeName = function (
  codename: string,
  tag?: string,
): string {
  return this.replaceAll(tag ?? "{{ CODENAME }}", codename);
};

export {};
