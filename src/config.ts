import * as path from "path";
import { fileURLToPath } from "url";

export function getExtensionRoot(): string {
  // 1. Check for --extension-path argument
  const extPathArgIndex = process.argv.indexOf("--extension-path");
  if (extPathArgIndex !== -1 && process.argv[extPathArgIndex + 1]) {
    return process.argv[extPathArgIndex + 1];
  }

  // 2. Check for EXTENSION_ROOT environment variable
  if (process.env.EXTENSION_ROOT) {
    return process.env.EXTENSION_ROOT;
  }

  // 3. Infer from current file location (dist/config.js or dist/hooks/...)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // If we are in dist/hooks/ or dist/mcp/, the root is two levels up
  if (__dirname.endsWith(path.join("dist", "hooks")) || __dirname.endsWith(path.join("dist", "mcp"))) {
    return path.resolve(__dirname, "..", "..");
  }
  
  // If we are in dist/, the root is one level up
  if (__dirname.endsWith("dist")) {
    return path.resolve(__dirname, "..");
  }

  return process.cwd();
}

export function getConfigPath(): string {
  return path.join(getExtensionRoot(), ".headsdown.json");
}
