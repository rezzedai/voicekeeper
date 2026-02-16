#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { detectAI } from "./analyzers/ai-detector";
import { buildProfile } from "./analyzers/voice-profiler";
import { matchVoice } from "./analyzers/voice-matcher";

function readInput(fileOrText: string): string {
  if (fileOrText === "-") {
    return fs.readFileSync(0, "utf-8");
  }
  const resolved = path.resolve(fileOrText);
  if (fs.existsSync(resolved)) {
    return fs.readFileSync(resolved, "utf-8");
  }
  return fileOrText;
}

function printUsage(): void {
  console.log(`voicekeeper — AI writing detection & voice matching

Usage:
  voicekeeper detect <file|text|->       Detect AI-generated writing patterns
  voicekeeper profile <file> [--name N]  Build a voice profile from reference text
  voicekeeper match <file> --profile P   Match text against a voice profile

Options:
  --pretty       Pretty-print JSON output
  --name NAME    Name for the voice profile (default: filename)
  --profile FILE Path to a voice profile JSON file
  -h, --help     Show this help message

Examples:
  voicekeeper detect article.txt
  voicekeeper detect "This is some text to analyze"
  echo "text" | voicekeeper detect -
  voicekeeper profile reference.txt --name "flynn"
  voicekeeper match draft.txt --profile flynn-profile.json`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const pretty = args.includes("--pretty");

  const format = (obj: unknown): string =>
    pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);

  if (command === "detect") {
    const input = args[1];
    if (!input) {
      console.error("Error: detect requires a file path, text string, or - for stdin");
      process.exit(1);
    }
    const text = readInput(input);
    const result = detectAI(text);
    console.log(format(result));
  } else if (command === "profile") {
    const input = args[1];
    if (!input) {
      console.error("Error: profile requires a file path");
      process.exit(1);
    }
    const text = readInput(input);
    const nameIdx = args.indexOf("--name");
    const name = nameIdx !== -1 && args[nameIdx + 1]
      ? args[nameIdx + 1]
      : path.basename(input, path.extname(input));
    const profile = buildProfile(text, name);
    console.log(format(profile));
  } else if (command === "match") {
    const input = args[1];
    if (!input) {
      console.error("Error: match requires a file path or text");
      process.exit(1);
    }

    const profileIdx = args.indexOf("--profile");
    if (profileIdx === -1 || !args[profileIdx + 1]) {
      console.error("Error: match requires --profile <file>");
      process.exit(1);
    }

    const profilePath = path.resolve(args[profileIdx + 1]);
    if (!fs.existsSync(profilePath)) {
      console.error(`Error: profile file not found: ${profilePath}`);
      process.exit(1);
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
    const text = readInput(input);
    const result = matchVoice(text, profileData);
    console.log(format(result));
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

main();
