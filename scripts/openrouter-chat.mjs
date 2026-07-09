#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

function parseEnvContent(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function loadEnvFiles() {
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;
    const content = await readFile(filePath, "utf8");
    parseEnvContent(content);
  }
}

function parseArgs(argv) {
  const options = {
    model: process.env.OPENROUTER_MODEL || "~openai/gpt-latest",
    temperature: undefined,
    system: process.env.OPENROUTER_SYSTEM_PROMPT || "",
    promptParts: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--model" && argv[index + 1]) {
      options.model = argv[index + 1];
      index += 1;
      continue;
    }
    if (current === "--temperature" && argv[index + 1]) {
      options.temperature = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (current === "--system" && argv[index + 1]) {
      options.system = argv[index + 1];
      index += 1;
      continue;
    }
    options.promptParts.push(current);
  }

  return options;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function main() {
  await loadEnvFiles();

  const { model, temperature, system, promptParts } = parseArgs(process.argv.slice(2));
  const prompt = promptParts.join(" ").trim() || (process.stdin.isTTY ? "" : await readStdin());

  if (!prompt) {
    console.error('Usage: npm run openrouter:chat -- "your prompt" [--model MODEL] [--temperature N] [--system PROMPT]');
    process.exit(1);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://synnex.lk",
      "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME || "Synnex IT Solution",
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
      temperature,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text);
  const output = data?.choices?.[0]?.message?.content?.trim() || "";
  process.stdout.write(output + "\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
