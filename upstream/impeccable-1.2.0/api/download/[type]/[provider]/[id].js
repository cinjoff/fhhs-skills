import { readFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../../../..");

const PROVIDER_CONFIG_DIRS = {
  'cursor': '.cursor',
  'claude-code': '.claude',
  'gemini': '.gemini',
  'codex': '.codex',
  'agents': '.agents',
  'kiro': '.kiro',
};

function getFilePath(type, provider, id) {
  const distDir = join(PROJECT_ROOT, "dist");

  const configDir = PROVIDER_CONFIG_DIRS[provider];
  if (!configDir) return null;

  if (type === "skill" || type === "command") {
    return join(distDir, provider, configDir, "skills", id, "SKILL.md");
  }

  return null;
}

const VALID_ID = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_PROVIDERS = [
  'cursor', 'claude-code', 'gemini', 'codex', 'agents', 'kiro',
  'universal', 'universal-prefixed',
];

export default function handler(req, res) {
  try {
    const { type, provider, id } = req.query;

    if (type !== "skill" && type !== "command") {
      return res.status(400).json({ error: "Invalid type" });
    }

    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    if (!id || !VALID_ID.test(id)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const filePath = getFilePath(type, provider, id);

    if (!filePath) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = readFileSync(filePath);
    const fileName = basename(filePath).replace(/[^a-zA-Z0-9._-]/g, '');
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(content);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

