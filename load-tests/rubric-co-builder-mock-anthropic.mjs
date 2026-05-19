/**
 * Mock Anthropic API server for rubric-co-builder load testing.
 *
 * The app calls POST /v1/messages (fire-and-forget, in next/server `after()`)
 * when a room is created.  This server intercepts those calls so the load test
 * never hits the real API and never blocks on a slow upstream.
 *
 * Start before the dev server:
 *   node load-tests/rubric-co-builder-mock-anthropic.mjs
 * Then start the dev server with:
 *   ANTHROPIC_BASE_URL=http://localhost:8787 ANTHROPIC_API_KEY=test-key ...
 */

import { createServer } from "node:http";

const PORT = 8787;
let requestCount = 0;

const MOCK_BODY = JSON.stringify({
  id: "msg_mock000000000000000",
  type: "message",
  role: "assistant",
  content: [
    {
      type: "text",
      text: "TITLE: a student case study on circular economy\nCONTENT: the project examines how a regional textile manufacturer could transition to a closed-loop production model. the author presents a clear problem statement and draws on three relevant academic sources. the stakeholder analysis is thorough, covering suppliers, consumers, and local government, though the financial modelling section lacks specificity about transition costs. the proposed phased implementation plan is realistic but would benefit from clearer success metrics at each stage.",
    },
  ],
  model: "claude-sonnet-4-5",
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 180, output_tokens: 95 },
});

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/v1/messages") {
    requestCount++;
    // drain body so the connection closes cleanly
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(MOCK_BODY);
    });
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.on("error", (err) => {
  console.error("mock-anthropic error:", err.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`mock anthropic listening on http://localhost:${PORT}`);
  console.log(`  (intercepting POST /v1/messages — request count logged below)`);
});

// log request count every 10 s so the operator can see activity
setInterval(() => {
  if (requestCount > 0) {
    console.log(`  [mock-anthropic] handled ${requestCount} message request(s) so far`);
  }
}, 10_000).unref();
