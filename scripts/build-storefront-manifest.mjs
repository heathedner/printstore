#!/usr/bin/env node
/**
 * Scans assets/img/storefront/<collection>/ and writes assets/storefront-manifest.json.
 * Pairing: "X.png|jpg|..." is the main image; "X_alt.png|jpg|..." (any case) is the alternate.
 * Collection title is derived from the folder name (e.g. mini_dragons → Mini Dragons).
 *
 * Run from repo root: node scripts/build-storefront-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const STOREFRONT_DIR = path.join(ROOT, "assets", "img", "storefront");
const OUT_FILE = path.join(ROOT, "assets", "storefront-manifest.json");

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

function titleCaseWords(s) {
  return s
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function folderToTitle(folderName) {
  return titleCaseWords(folderName.replace(/_/g, " "));
}

function scanCollection(folderName) {
  const dir = path.join(STOREFRONT_DIR, folderName);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;

  const files = fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f));
  /** @type {Map<string, { path: string, stem: string }>} */
  const mains = new Map();
  /** @type {Map<string, string>} */
  const alts = new Map();

  function normalizeSlug(s) {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_");
  }

  /** @returns {string | null} base slug for pairing */
  function altBaseSlug(stem) {
    const lower = stem.toLowerCase();
    if (lower.endsWith("_alt")) {
      return normalizeSlug(stem.slice(0, -"_alt".length));
    }
    if (lower.endsWith(" alt")) {
      return normalizeSlug(stem.slice(0, -" alt".length));
    }
    return null;
  }

  for (const file of files) {
    const ext = path.extname(file);
    const stem = path.basename(file, ext);
    const relPosix = ["assets", "img", "storefront", folderName, file].join("/");

    const altBase = altBaseSlug(stem);
    if (altBase) {
      alts.set(altBase, relPosix);
    } else {
      mains.set(normalizeSlug(stem), { path: relPosix, stem });
    }
  }

  const items = [];
  for (const [slug, main] of mains) {
    const altPath = alts.get(slug) ?? null;
    items.push({
      slug,
      label: titleCaseWords(main.stem.replace(/_/g, " ").trim()),
      main: main.path,
      alt: altPath,
    });
  }

  items.sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    id: folderName,
    title: folderToTitle(folderName),
    items,
  };
}

function main() {
  if (!fs.existsSync(STOREFRONT_DIR)) {
    fs.mkdirSync(STOREFRONT_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(STOREFRONT_DIR, { withFileTypes: true });
  const folders = entries.filter((d) => d.isDirectory()).map((d) => d.name).sort();

  const collections = folders.map(scanCollection).filter(Boolean);

  const payload = { version: 1, generatedAt: new Date().toISOString(), collections };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(
    "Wrote",
    path.relative(ROOT, OUT_FILE),
    "—",
    collections.map((c) => `${c.title} (${c.items.length})`).join(", ") || "(no collections)",
  );
}

main();
