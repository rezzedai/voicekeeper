#!/usr/bin/env node

import * as readline from "readline";
import { detectAI } from "./analyzers/ai-detector";
import { buildProfile } from "./analyzers/voice-profiler";
import { matchVoice } from "./analyzers/voice-matcher";
import type { VoiceProfile } from "./types";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

function send(response: JsonRpcResponse): void {
  const json = JSON.stringify(response);
  process.stdout.write(json + "\n");
}

const TOOLS = [
  {
    name: "detect_ai",
    description: "Analyze text for AI-generated writing patterns. Returns a score (0-100), verdict (human/mixed/ai), and flagged patterns.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The text to analyze" },
      },
      required: ["text"],
    },
  },
  {
    name: "build_voice_profile",
    description: "Build a voice profile from reference text. Use this to capture a writer's style for later matching.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Reference text to build profile from" },
        name: { type: "string", description: "Name for the voice profile" },
      },
      required: ["text", "name"],
    },
  },
  {
    name: "match_voice",
    description: "Compare text against a voice profile to check if the writing style matches.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to compare" },
        profile: { type: "object", description: "A voice profile object (from build_voice_profile)" },
      },
      required: ["text", "profile"],
    },
  },
];

function handleRequest(req: JsonRpcRequest): void {
  const { id, method, params } = req;

  if (method === "initialize") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "voicekeeper", version: "0.1.0" },
      },
    });
    return;
  }

  if (method === "notifications/initialized") {
    // No response needed for notifications
    return;
  }

  if (method === "tools/list") {
    send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    return;
  }

  if (method === "tools/call") {
    const toolName = (params as Record<string, unknown>)?.name as string;
    const args = (params as Record<string, unknown>)?.arguments as Record<string, unknown>;

    try {
      let result: unknown;

      if (toolName === "detect_ai") {
        result = detectAI(args.text as string);
      } else if (toolName === "build_voice_profile") {
        result = buildProfile(args.text as string, args.name as string);
      } else if (toolName === "match_voice") {
        result = matchVoice(args.text as string, args.profile as VoiceProfile);
      } else {
        send({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
        });
        return;
      }

      send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        },
      });
    }
    return;
  }

  send({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

// Stdio transport
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line: string) => {
  try {
    const req = JSON.parse(line) as JsonRpcRequest;
    handleRequest(req);
  } catch {
    send({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
  }
});
