#!/usr/bin/env node
/**
 * Compile structured eval specs into agent-skills-eval compatible evals.json.
 *
 * Source of truth:  <skill>/evals/spec.json  (checks with type/value/description)
 * Generated output: <skill>/evals/evals.json (string assertions for LLM judge)
 *
 * Usage:
 *   node scripts/compile-evals.mjs
 *   node scripts/compile-evals.mjs --check
 *   node scripts/compile-evals.mjs --skill plugins/.../hedera-token-service
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const skillArgIndex = args.indexOf("--skill");
const skillFilter = skillArgIndex >= 0 ? args[skillArgIndex + 1] : undefined;

function findSpecFiles(root) {
  const specs = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name === "spec.json" && path.basename(dir) === "evals") {
        specs.push(fullPath);
      }
    }
  }

  walk(root);
  return specs.sort();
}

function normalizeJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function checkToRubric(check) {
  if (typeof check.rubric === "string" && check.rubric.trim()) {
    return check.rubric.trim();
  }

  const description = typeof check.description === "string" ? check.description.trim() : "";
  const value = typeof check.value === "string" ? check.value : "";

  if (check.type === "contains") {
    if (description) {
      if (/^imports\b/i.test(description)) {
        return `The output imports from ${value || "the correct package"}`;
      }
      if (/^(uses|sets|creates|demonstrates|accesses|gets|checks|sends|switches)\b/i.test(description)) {
        const rest = description.charAt(0).toLowerCase() + description.slice(1);
        return `The output ${rest}`;
      }
      return `The output includes ${value}: ${description}`;
    }
    return `The output includes ${value}`;
  }

  if (check.type === "regex") {
    if (description) {
      return `The output satisfies: ${description}`;
    }
    return `The output matches the expected pattern (${check.name})`;
  }

  throw new Error(`Unsupported check type "${check.type}" in check "${check.name}"`);
}

function compileSpec(specPath) {
  const specDir = path.dirname(specPath);
  const raw = JSON.parse(readFileSync(specPath, "utf8"));

  if (!raw.skill_name || !Array.isArray(raw.evals)) {
    throw new Error(`${specPath} must contain skill_name and evals[]`);
  }

  const compiled = {
    skill_name: raw.skill_name,
    evals: raw.evals.map((evalCase, index) => {
      const checks = evalCase.checks ?? evalCase.assertions;
      if (!Array.isArray(checks)) {
        throw new Error(`${specPath} evals[${index}] must include checks[]`);
      }

      return {
        id: evalCase.id ?? index,
        prompt: evalCase.prompt,
        expected_output: evalCase.expected_output,
        files: Array.isArray(evalCase.files) ? evalCase.files : [],
        assertions: checks.map((check) => {
          if (!check.name || !check.type) {
            throw new Error(`${specPath} evals[${index}] has an invalid check`);
          }
          return checkToRubric(check);
        }),
      };
    }),
  };

  if (raw.defaults) {
    compiled.defaults = raw.defaults;
  }

  return {
    specPath,
    outputPath: path.join(specDir, "evals.json"),
    compiled,
  };
}

function main() {
  const pluginsRoot = path.join(repoRoot, "plugins");
  if (!statSync(pluginsRoot).isDirectory()) {
    throw new Error(`Expected plugins directory at ${pluginsRoot}`);
  }

  let specFiles = findSpecFiles(pluginsRoot);
  if (skillFilter) {
    const resolved = path.resolve(repoRoot, skillFilter);
    specFiles = specFiles.filter((specPath) => specPath.startsWith(resolved + path.sep) || path.dirname(specPath) === path.join(resolved, "evals"));
  }

  if (specFiles.length === 0) {
    console.error("No evals/spec.json files found.");
    process.exit(1);
  }

  let changed = 0;

  for (const specPath of specFiles) {
    const { outputPath, compiled } = compileSpec(specPath);
    const next = normalizeJson(compiled);
    const relSpec = path.relative(repoRoot, specPath);
    const relOut = path.relative(repoRoot, outputPath);

    if (checkOnly) {
      let current = "";
      try {
        current = readFileSync(outputPath, "utf8");
      } catch {
        console.error(`✗ ${relOut} is missing (run: npm run evals:compile)`);
        changed += 1;
        continue;
      }
      if (current !== next) {
        console.error(`✗ ${relOut} is out of date (run: npm run evals:compile)`);
        changed += 1;
      } else {
        console.log(`✓ ${relOut}`);
      }
      continue;
    }

    writeFileSync(outputPath, next, "utf8");
    console.log(`Compiled ${relSpec} -> ${relOut}`);
  }

  if (checkOnly && changed > 0) {
    process.exit(1);
  }
}

main();
