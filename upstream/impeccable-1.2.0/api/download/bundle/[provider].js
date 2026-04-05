import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../../..");

const ALLOWED_PROVIDERS = [
  'universal', 'universal-prefixed',
];

export default function handler(req, res) {
  try {
    const { provider } = req.query;

    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    const distDir = join(PROJECT_ROOT, "dist");
    const zipPath = join(distDir, `${provider}.zip`);

    if (!existsSync(zipPath)) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    const content = readFileSync(zipPath);
    res.setHeader("Content-Type", "application/zip");
    const safeProvider = provider.replace(/[^a-zA-Z0-9._-]/g, '');
    res.setHeader("Content-Disposition", `attachment; filename="impeccable-style-${safeProvider}.zip"`);
    res.send(content);
  } catch (error) {
    console.error("Error downloading bundle:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

