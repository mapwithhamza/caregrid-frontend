import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as shapefile from "shapefile";
import simplify from "@turf/simplify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUT_DIR = "D:\\HAckathon\\India Shapefile With Kashmir\\India Shape";
const INPUT_DIR = process.env.INDIA_SHAPEFILE_DIR ?? DEFAULT_INPUT_DIR;
const OUTPUT_PATH = path.resolve(__dirname, "../public/data/india-boundaries.geojson");

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function chooseShapefile(shpPaths) {
  const preferred = shpPaths.find((item) => /(?:^|_|-)st(?:_|-|$)|state/i.test(item));
  return preferred ?? shpPaths[0];
}

async function collectShapefilesRecursively(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectShapefilesRecursively(fullPath);
      results.push(...nested);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".shp")) {
      results.push(fullPath);
    }
  }

  return results;
}

async function loadFeatureCollection(shpPath) {
  const dbfPath = shpPath.replace(/\.shp$/i, ".dbf");
  const hasDbf = await fs
    .access(dbfPath)
    .then(() => true)
    .catch(() => false);

  const source = await shapefile.open(shpPath, hasDbf ? dbfPath : undefined);
  const features = [];

  while (true) {
    const record = await source.read();
    if (record.done) {
      break;
    }

    if (record.value && record.value.type === "Feature") {
      features.push(record.value);
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}

async function main() {
  const entries = await fs.readdir(INPUT_DIR, { withFileTypes: true }).catch(() => null);

  if (!entries) {
    throw new Error(`Input folder not found: ${INPUT_DIR}`);
  }

  const shpFiles = await collectShapefilesRecursively(INPUT_DIR);

  if (shpFiles.length === 0) {
    throw new Error(`No .shp file found in: ${INPUT_DIR}`);
  }

  const selectedShp = chooseShapefile(shpFiles);
  const rawGeojson = await loadFeatureCollection(selectedShp);

  if (!rawGeojson || rawGeojson.type !== "FeatureCollection") {
    throw new Error("Shapefile conversion did not return a valid FeatureCollection.");
  }

  const simplifiedGeojson = simplify(rawGeojson, {
    tolerance: 0.0002,
    highQuality: false,
    mutate: false
  });

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(simplifiedGeojson));

  const stat = await fs.stat(OUTPUT_PATH);
  console.log(`Input shapefile: ${selectedShp}`);
  console.log(`Features: ${simplifiedGeojson.features.length}`);
  console.log(`Output path: ${OUTPUT_PATH}`);
  console.log(`Output size: ${formatBytes(stat.size)}`);
}

main().catch((error) => {
  console.error(`Shapefile conversion failed: ${error.message}`);
  process.exitCode = 1;
});
