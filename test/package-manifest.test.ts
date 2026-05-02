import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");

describe("package manifest", () => {
  it("keeps extension assets in published files", async () => {
    const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8"));
    const requiredFiles = [
      "dist",
      "gemini-extension.json",
      "hooks",
      "skills",
      "agents",
      "commands",
      "policies"
    ];
    for (const file of requiredFiles) {
      expect(pkg.files).toContain(file);
    }
  });

  it("uses bundled SDK via devDependencies", async () => {
    const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8"));
    expect(pkg.dependencies["@headsdown/sdk"]).toBeUndefined();
    expect(pkg.devDependencies["@headsdown/sdk"]).toBeTruthy();
  });
});
