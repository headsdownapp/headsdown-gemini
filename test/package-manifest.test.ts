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

  it("does not globally deny every tool in extension policy", async () => {
    const policy = await readFile(join(ROOT, "policies", "headsdown.toml"), "utf-8");
    expect(policy).not.toMatch(/decision\s*=\s*"deny"[\s\S]*toolName\s*=\s*"\*"/);
    expect(policy).not.toMatch(/toolName\s*=\s*"\*"[\s\S]*decision\s*=\s*"deny"/);
  });
});
