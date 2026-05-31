/// <reference types="@cloudflare/workers-types" />
/**
 * raft.house real-time room — PartyServer Durable Object.
 *
 * Ported from the standalone PartyKit `RoomServer` (default export, constructor(room))
 * to the PartyServer `Server<Env>` subclass that runs as a DO on the raft-house Worker.
 * Wire protocol + reducer logic are byte-identical to the previous implementation —
 * only the runtime bindings have changed:
 *
 *   PartyKit                          PartyServer
 *   ----------------------------------------------------
 *   this.room.storage                 this.ctx.storage           (Durable Object storage)
 *   this.room.broadcast(str)          this.broadcast(str)
 *   this.room.getConnections()        this.getConnections()
 *   this.room.id                      this.name
 *   conn.uri (string)                 connection.uri             (same — partyserver preserves it)
 *   onMessage(message, sender)        onMessage(connection, message)   ← arg order flipped
 *
 * facilitatorConn instance field is intentionally NOT used. Even with hibernation off
 * (PartyServer's default — `static options = { hibernate: false }`), a DO can be evicted
 * when idle and instance fields are lost. We resolve the facilitator on demand via
 * getConnections() filtered by state.facilitatorId, which survives in storage.
 */

import { Server, type Connection, type ConnectionContext } from "partyserver";
import type {
  RoomState,
  ClientMessage,
  FacilitatorMessage,
  ParticipantMessage,
  Participant,
  ServerBroadcast,
} from "../lib/types";
import { TEMPO_DEFAULT_DURATION_MS } from "../lib/types";

function defaultState(roomId: string): RoomState {
  return {
    code: roomId,
    facilitatorId: null,
    mode: "sync",
    displayMode: "screenless",
    ageLevel: "professional",
    status: "lobby",
    activities: [],
    currentActivityIndex: 0,
    participants: {},
    timer: null,
    createdAt: Date.now(),
    resultsRevealed: false,
  };
}

export class RaftRoom extends Server<Env> {
  state: RoomState = defaultState("");

  async onStart() {
    const stored = await this.ctx.storage.get<RoomState>("state");
    this.state = stored ?? defaultState(this.name);
  }

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const role = url.searchParams.get("role");
    const name = url.searchParams.get("name") || "anonymous";

    if (role === "facilitator") {
      this.state.facilitatorId = connection.id;
    } else {
      const participant: Participant = {
        id: connection.id,
        displayName: name,
        role: (url.searchParams.get("participantRole") as Participant["role"]) || "participant",
        connectionStatus: "connected",
        currentActivityIndex: 0,
        responses: {},
        lastSeen: Date.now(),
      };
      this.state.participants[connection.id] = participant;
      this.broadcastMessage({ type: "participant-joined", participant });
    }

    connection.send(
      JSON.stringify({ type: "state-update", state: this.state, yourId: connection.id } satisfies ServerBroadcast),
    );
    await this.persist();
  }

  async onMessage(connection: Connection, message: string) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    if (msg.role === "facilitator") {
      // only the actual facilitator connection can issue facilitator commands
      if (connection.id !== this.state.facilitatorId) return;
      this.handleFacilitator(msg);
    } else {
      this.handleParticipant(msg, connection);
    }

    await this.persist();
  }

  onClose(connection: Connection) {
    if (connection.id === this.state.facilitatorId) {
      // don't end session — facilitator may reconnect
      return;
    }
    if (this.state.participants[connection.id]) {
      this.state.participants[connection.id].connectionStatus = "disconnected";
      this.broadcastMessage({ type: "participant-left", participantId: connection.id });
    }
  }

  // ── facilitator commands ─────────────────────────────────────

  private handleFacilitator(msg: FacilitatorMessage) {
    switch (msg.type) {
      case "setup": {
        if (this.state.activities.length === 0) {
          this.state.activities = msg.activities;
          this.state.status = "active";
          this.state.currentActivityIndex = 0;
          if (msg.displayMode) this.state.displayMode = msg.displayMode;
          if (msg.ageLevel) this.state.ageLevel = msg.ageLevel;
          this.broadcastState();
        }
        break;
      }

      case "advance": {
        const next = this.state.currentActivityIndex + 1;
        if (next < this.state.activities.length) {
          this.state.currentActivityIndex = next;
          this.state.resultsRevealed = false;
          this.state.timer = null;
          const newActivity = this.state.activities[this.state.currentActivityIndex];
          if (newActivity?.mechanic?.tempo) {
            const autoMs = TEMPO_DEFAULT_DURATION_MS[newActivity.mechanic.tempo];
            if (autoMs) {
              this.state.timer = {
                type: "countdown",
                durationMs: autoMs,
                startedAt: Date.now(),
              };
            }
          }
          this.broadcastMessage({
            type: "activity-changed",
            activityIndex: next,
            activity: this.state.activities[next],
          });
        }
        break;
      }

      case "goto": {
        if (msg.activityIndex >= 0 && msg.activityIndex < this.state.activities.length) {
          this.state.currentActivityIndex = msg.activityIndex;
          this.state.resultsRevealed = false;
          this.state.timer = null;
          const newActivity = this.state.activities[this.state.currentActivityIndex];
          if (newActivity?.mechanic?.tempo) {
            const autoMs = TEMPO_DEFAULT_DURATION_MS[newActivity.mechanic.tempo];
            if (autoMs) {
              this.state.timer = {
                type: "countdown",
                durationMs: autoMs,
                startedAt: Date.now(),
              };
            }
          }
          this.broadcastMessage({
            type: "activity-changed",
            activityIndex: msg.activityIndex,
            activity: this.state.activities[msg.activityIndex],
          });
        }
        break;
      }

      case "pause":
        this.state.status = "paused";
        if (this.state.timer && !this.state.timer.pausedAt) {
          this.state.timer.pausedAt = Date.now();
        }
        this.broadcastState();
        break;

      case "resume":
        this.state.status = "active";
        if (this.state.timer?.pausedAt) {
          const elapsed = this.state.timer.pausedAt - this.state.timer.startedAt;
          this.state.timer.startedAt = Date.now() - elapsed;
          this.state.timer.pausedAt = undefined;
        }
        this.broadcastState();
        break;

      case "set-mode":
        this.state.mode = msg.mode;
        this.broadcastState();
        break;

      case "set-age-level":
        this.state.ageLevel = msg.ageLevel;
        this.broadcastState();
        break;

      case "set-display-mode":
        this.state.displayMode = msg.displayMode;
        this.broadcastState();
        break;

      case "reveal-results": {
        this.state.resultsRevealed = true;
        const activity = this.state.activities[this.state.currentActivityIndex];
        if (activity) {
          const responses: Record<string, unknown> = {};
          for (const [pid, p] of Object.entries(this.state.participants)) {
            if (p.responses[activity.id] !== undefined) {
              responses[pid] = p.responses[activity.id];
            }
          }
          this.broadcastMessage({ type: "results-revealed", activityId: activity.id, responses });
        }
        break;
      }

      case "timer-start":
        this.state.timer = {
          type: "countdown",
          durationMs: msg.durationMs,
          startedAt: Date.now(),
        };
        this.broadcastMessage({ type: "timer-sync", timer: this.state.timer });
        break;

      case "timer-pause":
        if (this.state.timer && !this.state.timer.pausedAt) {
          this.state.timer.pausedAt = Date.now();
          this.broadcastMessage({ type: "timer-sync", timer: this.state.timer });
        }
        break;

      case "timer-clear":
        this.state.timer = null;
        this.broadcastMessage({ type: "timer-sync", timer: null });
        break;

      case "send-hint":
        if (msg.participantId) {
          for (const conn of this.getConnections()) {
            if (conn.id === msg.participantId) {
              conn.send(JSON.stringify({ type: "hint", hint: msg.hint } satisfies ServerBroadcast));
            }
          }
        } else {
          this.broadcastMessage({ type: "hint", hint: msg.hint });
        }
        break;

      case "kick":
        delete this.state.participants[msg.participantId];
        for (const conn of this.getConnections()) {
          if (conn.id === msg.participantId) conn.close();
        }
        this.broadcastState();
        break;

      case "end-session":
        this.state.status = "completed";
        this.broadcastMessage({ type: "session-ended" });
        break;
    }
  }

  // ── participant commands ─────────────────────────────────────

  private handleParticipant(msg: ParticipantMessage & { participantId: string }, sender: Connection) {
    const participant = this.state.participants[sender.id];
    if (!participant) return;

    switch (msg.type) {
      case "submit": {
        participant.responses[msg.activityId] = msg.response;
        participant.lastSeen = Date.now();
        this.broadcastState();
        break;
      }

      case "navigate": {
        if (this.state.mode === "async") {
          participant.currentActivityIndex = msg.activityIndex;
          this.broadcastState();
        }
        break;
      }

      case "request-hint": {
        // forward to whichever connection currently holds the facilitator id —
        // instance fields don't survive DO eviction, but state.facilitatorId does.
        const facilitatorId = this.state.facilitatorId;
        if (!facilitatorId) break;
        for (const conn of this.getConnections()) {
          if (conn.id === facilitatorId) {
            conn.send(
              JSON.stringify({
                type: "hint",
                hint: `${participant.displayName} is requesting a hint`,
              } satisfies ServerBroadcast),
            );
            break;
          }
        }
        break;
      }
    }
  }

  // ── helpers ──────────────────────────────────────────────────

  private broadcastMessage(msg: ServerBroadcast) {
    this.broadcast(JSON.stringify(msg));
  }

  private broadcastState() {
    this.broadcastMessage({ type: "state-update", state: this.state });
  }

  private async persist() {
    await this.ctx.storage.put("state", this.state);
  }
}

// PartyServer's <Env> generic — populated at the Worker level. We don't need any
// bindings from env inside the DO itself; this is here so the Server<Env> generic
// resolves cleanly without `any`.
interface Env {
  RaftRoom: DurableObjectNamespace;
}
