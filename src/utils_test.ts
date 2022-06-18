import { parseSemver } from "./utils.ts";
import { assert, assertEquals, assertFalse } from "https://deno.land/std@0.144.0/testing/asserts.ts";

Deno.test('parseSemver("v1.2.3")', () => {
  const semver = parseSemver("v1.2.3");
  assert(semver);
  assertEquals(semver.prefix, "v");
  assertEquals(semver.major, 1);
  assertEquals(semver.minor, 2);
  assertEquals(semver.patch, 3);
});

Deno.test('parseSemver("1.2.3")', () => {
  const semver = parseSemver("1.2.3");
  assert(semver);
  assertEquals(semver.prefix, "");
  assertEquals(semver.major, 1);
  assertEquals(semver.minor, 2);
  assertEquals(semver.patch, 3);
});

Deno.test('parseSemver("alpha")', () => {
  const semver = parseSemver("alpha");
  assertFalse(semver);
});
