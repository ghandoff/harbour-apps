import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type {
  AiUseLevel,
  AiUseVote,
  CalibrationScore,
  Criterion,
  CriterionSource,
  Participant,
  PledgeSlot,
  PledgeSlotIndex,
  Room,
  RoomSnapshot,
  RoomState,
  Scale,
  Vote,
} from "./types";
import { DEFAULT_DESCRIPTORS, PLEDGE_SLOTS, SCALE_LEVELS } from "./types";

type CreateRoomInput = {
  code: string;
  learning_outcome: string;
  project_description: string;
};

type CreateCriterionInput = {
  room_id: string;
  name: string;
  good_description: string | null;
  failure_description?: string | null;
  source: CriterionSource;
  required: boolean;
  position: number;
  status?: "proposed" | "selected";
};

type UpdateCriterionInput = {
  name?: string;
  good_description?: string | null;
  failure_description?: string | null;
};

export type Store = {
  codeExists(code: string): Promise<boolean>;
  createRoom(input: CreateRoomInput): Promise<Room>;
  createCriterion(input: CreateCriterionInput): Promise<Criterion>;
  updateCriterion(id: string, patch: UpdateCriterionInput): Promise<Criterion | null>;
  deleteCriterion(id: string): Promise<boolean>;
  getSnapshot(code: string): Promise<RoomSnapshot | null>;
  updateRoomState(code: string, state: RoomState): Promise<Room | null>;
  joinRoom(code: string): Promise<Participant | null>;
  participantExists(id: string, roomCode: string): Promise<boolean>;

  castVote(participantId: string, criterionId: string): Promise<Vote | null>;
  removeVote(participantId: string, criterionId: string): Promise<boolean>;
  countVotesForParticipant(participantId: string, roomId: string): Promise<number>;

  tallySelection(
    code: string,
    topN?: number,
  ): Promise<{ selected: Criterion[]; scales: Scale[] } | null>;

  upsertScaleDescriptor(
    criterionId: string,
    level: 1 | 2 | 3 | 4,
    descriptor: string,
  ): Promise<Scale | null>;

  submitCalibrationScore(
    participantId: string,
    criterionId: string,
    level: 1 | 2 | 3 | 4,
  ): Promise<CalibrationScore | null>;

  castAiVote(
    participantId: string,
    roomCode: string,
    level: AiUseLevel,
  ): Promise<AiUseVote | null>;

  tallyAiLadder(
    code: string,
  ): Promise<{ ceiling: AiUseLevel; counts: Record<AiUseLevel, number> } | null>;

  upsertPledgeSlot(
    roomCode: string,
    slotIndex: PledgeSlotIndex,
    content: string,
  ): Promise<PledgeSlot | null>;
};

function uuid(): string {
  return crypto.randomUUID();
}

// ---------- in-memory backend ----------

type MemoryDb = {
  rooms: Map<string, Room>;
  criteria: Map<string, Criterion>;
  participants: Map<string, Participant>;
  votes: Map<string, Vote>;
  scales: Map<string, Scale>;
  calibration: Map<string, CalibrationScore>;
  aiVotes: Map<string, AiUseVote>;
  pledgeSlots: Map<string, PledgeSlot>;
};

function memoryStore(): Store {
  const db: MemoryDb = {
    rooms: new Map(),
    criteria: new Map(),
    participants: new Map(),
    votes: new Map(),
    scales: new Map(),
    calibration: new Map(),
    aiVotes: new Map(),
    pledgeSlots: new Map(),
  };

  function findByCode(code: string): Room | null {
    for (const r of db.rooms.values()) if (r.code === code) return r;
    return null;
  }

  function voteKey(participantId: string, criterionId: string): string {
    return `${participantId}:${criterionId}`;
  }

  function scaleKey(criterionId: string, level: number): string {
    return `${criterionId}:${level}`;
  }

  function calibrationKey(participantId: string, criterionId: string): string {
    return `${participantId}:${criterionId}`;
  }

  return {
    async codeExists(code) {
      return findByCode(code) !== null;
    },

    async createRoom(input) {
      const now = new Date().toISOString();
      const room: Room = {
        id: uuid(),
        code: input.code,
        learning_outcome: input.learning_outcome,
        project_description: input.project_description,
        state: "lobby",
        step_started_at: now,
        created_at: now,
      };
      db.rooms.set(room.id, room);
      // pre-seed the four pledge slots
      for (const slot of PLEDGE_SLOTS) {
        const s: PledgeSlot = {
          id: uuid(),
          room_id: room.id,
          slot_index: slot.index,
          content: "",
          updated_at: now,
        };
        db.pledgeSlots.set(`${room.id}:${slot.index}`, s);
      }
      return room;
    },

    async createCriterion(input) {
      const criterion: Criterion = {
        id: uuid(),
        room_id: input.room_id,
        name: input.name,
        good_description: input.good_description,
        failure_description: input.failure_description ?? null,
        source: input.source,
        required: input.required,
        status: input.status ?? (input.source === "seed" ? "selected" : "proposed"),
        position: input.position,
        created_at: new Date().toISOString(),
      };
      db.criteria.set(criterion.id, criterion);
      return criterion;
    },

    async updateCriterion(id, patch) {
      const existing = db.criteria.get(id);
      if (!existing) return null;
      const updated: Criterion = {
        ...existing,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.good_description !== undefined
          ? { good_description: patch.good_description }
          : {}),
        ...(patch.failure_description !== undefined
          ? { failure_description: patch.failure_description }
          : {}),
      };
      db.criteria.set(id, updated);
      return updated;
    },

    async deleteCriterion(id) {
      const existing = db.criteria.get(id);
      if (!existing) return false;
      db.criteria.delete(id);
      // cascade: votes + scales + calibration referencing this criterion
      for (const [k, v] of db.votes) if (v.criterion_id === id) db.votes.delete(k);
      for (const [k, s] of db.scales) if (s.criterion_id === id) db.scales.delete(k);
      for (const [k, c] of db.calibration)
        if (c.criterion_id === id) db.calibration.delete(k);
      return true;
    },

    async getSnapshot(code) {
      const room = findByCode(code);
      if (!room) return null;
      const criteria = [...db.criteria.values()]
        .filter((c) => c.room_id === room.id)
        .sort((a, b) =>
          a.position !== b.position
            ? a.position - b.position
            : a.created_at.localeCompare(b.created_at),
        );
      const criterionIds = new Set(criteria.map((c) => c.id));
      const participants_count = [...db.participants.values()].filter(
        (p) => p.room_id === room.id,
      ).length;
      const votes = [...db.votes.values()].filter((v) => criterionIds.has(v.criterion_id));
      const scales = [...db.scales.values()].filter((s) => criterionIds.has(s.criterion_id));
      const calibration_scores = [...db.calibration.values()].filter((c) =>
        criterionIds.has(c.criterion_id),
      );
      const ai_use_votes = [...db.aiVotes.values()].filter((v) => v.room_id === room.id);
      const pledge_slots = [...db.pledgeSlots.values()]
        .filter((s) => s.room_id === room.id)
        .sort((a, b) => a.slot_index - b.slot_index);
      return {
        room,
        criteria,
        participants_count,
        votes,
        scales,
        calibration_scores,
        ai_use_votes,
        pledge_slots,
      };
    },

    async updateRoomState(code, state) {
      const room = findByCode(code);
      if (!room) return null;
      const updated: Room = {
        ...room,
        state,
        step_started_at: new Date().toISOString(),
      };
      db.rooms.set(updated.id, updated);
      return updated;
    },

    async joinRoom(code) {
      const room = findByCode(code);
      if (!room) return null;
      const participant: Participant = {
        id: uuid(),
        room_id: room.id,
        joined_at: new Date().toISOString(),
      };
      db.participants.set(participant.id, participant);
      return participant;
    },

    async participantExists(id, roomCode) {
      const room = findByCode(roomCode);
      if (!room) return false;
      const p = db.participants.get(id);
      return !!p && p.room_id === room.id;
    },

    async castVote(participantId, criterionId) {
      const key = voteKey(participantId, criterionId);
      if (db.votes.has(key)) return db.votes.get(key)!;
      const participant = db.participants.get(participantId);
      const criterion = db.criteria.get(criterionId);
      if (!participant || !criterion) return null;
      const vote: Vote = {
        id: uuid(),
        participant_id: participantId,
        criterion_id: criterionId,
        created_at: new Date().toISOString(),
      };
      db.votes.set(key, vote);
      return vote;
    },

    async removeVote(participantId, criterionId) {
      return db.votes.delete(voteKey(participantId, criterionId));
    },

    async countVotesForParticipant(participantId, roomId) {
      const roomCriteriaIds = new Set(
        [...db.criteria.values()].filter((c) => c.room_id === roomId).map((c) => c.id),
      );
      return [...db.votes.values()].filter(
        (v) => v.participant_id === participantId && roomCriteriaIds.has(v.criterion_id),
      ).length;
    },

    async tallySelection(code, topN = 5) {
      const room = findByCode(code);
      if (!room) return null;
      const roomCriteria = [...db.criteria.values()].filter((c) => c.room_id === room.id);
      const counts = new Map<string, number>();
      for (const v of db.votes.values()) {
        if (roomCriteria.some((c) => c.id === v.criterion_id)) {
          counts.set(v.criterion_id, (counts.get(v.criterion_id) ?? 0) + 1);
        }
      }
      const participants = [...db.participants.values()].filter(
        (p) => p.room_id === room.id,
      );
      const totalPossible = participants.length * 3;
      const threshold = Math.max(1, Math.ceil(totalPossible * 0.3));

      // pick: all required + top N by vote count meeting threshold, capped at topN
      const requiredIds = new Set(
        roomCriteria.filter((c) => c.required).map((c) => c.id),
      );
      const nonRequiredSorted = roomCriteria
        .filter((c) => !c.required)
        .sort(
          (a, b) =>
            (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
            a.position - b.position,
        );

      const picked = new Set<string>(requiredIds);
      for (const c of nonRequiredSorted) {
        if (picked.size >= topN) break;
        if ((counts.get(c.id) ?? 0) >= threshold) picked.add(c.id);
      }
      // if nobody made the threshold, keep the top 3 anyway so the class has something
      if (picked.size === requiredIds.size) {
        for (const c of nonRequiredSorted.slice(0, Math.min(3, topN - picked.size))) {
          picked.add(c.id);
        }
      }

      // update statuses and reset positions for the selected rubric order
      let position = 0;
      const selected: Criterion[] = [];
      for (const c of roomCriteria) {
        if (picked.has(c.id)) {
          const updated: Criterion = { ...c, status: "selected", position: position++ };
          db.criteria.set(c.id, updated);
          selected.push(updated);
        } else {
          db.criteria.set(c.id, { ...c, status: "rejected" });
        }
      }
      selected.sort((a, b) => a.position - b.position);

      // seed scale descriptors for every selected criterion (idempotent)
      const scales: Scale[] = [];
      for (const c of selected) {
        for (const { level } of SCALE_LEVELS) {
          const key = scaleKey(c.id, level);
          if (!db.scales.has(key)) {
            const scale: Scale = {
              id: uuid(),
              criterion_id: c.id,
              level,
              descriptor: DEFAULT_DESCRIPTORS[level],
              updated_at: new Date().toISOString(),
            };
            db.scales.set(key, scale);
            scales.push(scale);
          } else {
            scales.push(db.scales.get(key)!);
          }
        }
      }

      return { selected, scales };
    },

    async upsertScaleDescriptor(criterionId, level, descriptor) {
      const key = scaleKey(criterionId, level);
      const existing = db.scales.get(key);
      const now = new Date().toISOString();
      if (existing) {
        const updated: Scale = { ...existing, descriptor, updated_at: now };
        db.scales.set(key, updated);
        return updated;
      }
      const scale: Scale = {
        id: uuid(),
        criterion_id: criterionId,
        level,
        descriptor,
        updated_at: now,
      };
      db.scales.set(key, scale);
      return scale;
    },

    async submitCalibrationScore(participantId, criterionId, level) {
      const key = calibrationKey(participantId, criterionId);
      const existing = db.calibration.get(key);
      const now = new Date().toISOString();
      if (existing) {
        const updated: CalibrationScore = { ...existing, level, created_at: now };
        db.calibration.set(key, updated);
        return updated;
      }
      const score: CalibrationScore = {
        id: uuid(),
        participant_id: participantId,
        criterion_id: criterionId,
        level,
        created_at: now,
      };
      db.calibration.set(key, score);
      return score;
    },

    async castAiVote(participantId, roomCode, level) {
      const room = findByCode(roomCode);
      if (!room) return null;
      const participant = db.participants.get(participantId);
      if (!participant || participant.room_id !== room.id) return null;
      const key = `${room.id}:${participantId}`;
      const now = new Date().toISOString();
      const existing = db.aiVotes.get(key);
      if (existing) {
        const updated: AiUseVote = { ...existing, level, created_at: now };
        db.aiVotes.set(key, updated);
        return updated;
      }
      const vote: AiUseVote = {
        id: uuid(),
        participant_id: participantId,
        room_id: room.id,
        level,
        created_at: now,
      };
      db.aiVotes.set(key, vote);
      return vote;
    },

    async tallyAiLadder(code) {
      const room = findByCode(code);
      if (!room) return null;
      const counts: Record<AiUseLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const v of db.aiVotes.values()) {
        if (v.room_id === room.id) counts[v.level]++;
      }
      let ceiling: AiUseLevel = 0;
      let bestCount = -1;
      for (const lvl of [0, 1, 2, 3, 4] as AiUseLevel[]) {
        // tie-break: favour lower-numbered rung (more conservative)
        if (counts[lvl] > bestCount) {
          bestCount = counts[lvl];
          ceiling = lvl;
        }
      }
      return { ceiling, counts };
    },

    async upsertPledgeSlot(roomCode, slotIndex, content) {
      const room = findByCode(roomCode);
      if (!room) return null;
      const key = `${room.id}:${slotIndex}`;
      const now = new Date().toISOString();
      const existing = db.pledgeSlots.get(key);
      const slot: PledgeSlot = existing
        ? { ...existing, content, updated_at: now }
        : {
            id: uuid(),
            room_id: room.id,
            slot_index: slotIndex,
            content,
            updated_at: now,
          };
      db.pledgeSlots.set(key, slot);
      return slot;
    },
  };
}

// ---------- neon backend ----------

function neonStore(url: string): Store {
  const sql: NeonQueryFunction<false, false> = neon(url);

  return {
    async codeExists(code) {
      const rows = await sql`
        select 1 from rubric_cobuilder.rooms where code = ${code} limit 1
      `;
      return rows.length > 0;
    },

    async createRoom(input) {
      const [row] = await sql`
        insert into rubric_cobuilder.rooms (code, learning_outcome, project_description)
        values (${input.code}, ${input.learning_outcome}, ${input.project_description})
        returning id, code, learning_outcome, project_description, state,
                  step_started_at, created_at
      `;
      // pre-seed pledge slots
      for (const slot of PLEDGE_SLOTS) {
        await sql`
          insert into rubric_cobuilder.pledge_slots (room_id, slot_index, content)
          values (${row.id}, ${slot.index}, '')
          on conflict (room_id, slot_index) do nothing
        `;
      }
      return row as Room;
    },

    async createCriterion(input) {
      const [row] = await sql`
        insert into rubric_cobuilder.criteria
          (room_id, name, good_description, failure_description, source,
           required, status, position)
        values
          (${input.room_id}, ${input.name}, ${input.good_description},
           ${input.failure_description ?? null}, ${input.source},
           ${input.required}, ${input.status ?? (input.source === "seed" ? "selected" : "proposed")},
           ${input.position})
        returning id, room_id, name, good_description, failure_description,
                  source, required, status, position, created_at
      `;
      return row as Criterion;
    },

    async updateCriterion(id, patch) {
      const rows = await sql`
        update rubric_cobuilder.criteria
        set
          name = coalesce(${patch.name ?? null}, name),
          good_description = coalesce(${patch.good_description ?? null}, good_description),
          failure_description = coalesce(${patch.failure_description ?? null}, failure_description)
        where id = ${id}
        returning id, room_id, name, good_description, failure_description,
                  source, required, status, position, created_at
      `;
      return (rows[0] as Criterion | undefined) ?? null;
    },

    async deleteCriterion(id) {
      const rows = await sql`
        delete from rubric_cobuilder.criteria where id = ${id} returning id
      `;
      return rows.length > 0;
    },

    async getSnapshot(code) {
      const rooms = await sql`
        select id, code, learning_outcome, project_description, state,
               step_started_at, created_at
        from rubric_cobuilder.rooms
        where code = ${code}
        limit 1
      `;
      if (rooms.length === 0) return null;
      const room = rooms[0] as Room;
      const criteria = (await sql`
        select id, room_id, name, good_description, failure_description,
               source, required, status, position, created_at
        from rubric_cobuilder.criteria
        where room_id = ${room.id}
        order by position asc, created_at asc
      `) as Criterion[];
      const [{ count }] = await sql`
        select count(*)::int as count
        from rubric_cobuilder.participants
        where room_id = ${room.id}
      `;
      const votes = (await sql`
        select v.id, v.participant_id, v.criterion_id, v.created_at
        from rubric_cobuilder.votes v
        join rubric_cobuilder.criteria c on c.id = v.criterion_id
        where c.room_id = ${room.id}
      `) as Vote[];
      const scales = (await sql`
        select s.id, s.criterion_id, s.level, s.descriptor, s.updated_at
        from rubric_cobuilder.scales s
        join rubric_cobuilder.criteria c on c.id = s.criterion_id
        where c.room_id = ${room.id}
      `) as Scale[];
      const calibration_scores = (await sql`
        select cs.id, cs.participant_id, cs.criterion_id, cs.level, cs.created_at
        from rubric_cobuilder.calibration_scores cs
        join rubric_cobuilder.criteria c on c.id = cs.criterion_id
        where c.room_id = ${room.id}
      `) as CalibrationScore[];
      const ai_use_votes = (await sql`
        select id, participant_id, room_id, level, created_at
        from rubric_cobuilder.ai_use_votes
        where room_id = ${room.id}
      `) as AiUseVote[];
      const pledge_slots = (await sql`
        select id, room_id, slot_index, content, updated_at
        from rubric_cobuilder.pledge_slots
        where room_id = ${room.id}
        order by slot_index asc
      `) as PledgeSlot[];

      return {
        room,
        criteria,
        participants_count: count as number,
        votes,
        scales,
        calibration_scores,
        ai_use_votes,
        pledge_slots,
      };
    },

    async updateRoomState(code, state) {
      const rows = await sql`
        update rubric_cobuilder.rooms
        set state = ${state}, step_started_at = now()
        where code = ${code}
        returning id, code, learning_outcome, project_description, state,
                  step_started_at, created_at
      `;
      return (rows[0] as Room | undefined) ?? null;
    },

    async joinRoom(code) {
      const rooms = await sql`
        select id from rubric_cobuilder.rooms where code = ${code} limit 1
      `;
      if (rooms.length === 0) return null;
      const [participant] = await sql`
        insert into rubric_cobuilder.participants (room_id)
        values (${rooms[0].id})
        returning id, room_id, joined_at
      `;
      return participant as Participant;
    },

    async participantExists(id, roomCode) {
      const rows = await sql`
        select 1
        from rubric_cobuilder.participants p
        join rubric_cobuilder.rooms r on r.id = p.room_id
        where p.id = ${id} and r.code = ${roomCode}
        limit 1
      `;
      return rows.length > 0;
    },

    async castVote(participantId, criterionId) {
      const rows = await sql`
        insert into rubric_cobuilder.votes (participant_id, criterion_id)
        values (${participantId}, ${criterionId})
        on conflict (participant_id, criterion_id) do nothing
        returning id, participant_id, criterion_id, created_at
      `;
      if (rows.length === 0) {
        const [existing] = await sql`
          select id, participant_id, criterion_id, created_at
          from rubric_cobuilder.votes
          where participant_id = ${participantId} and criterion_id = ${criterionId}
          limit 1
        `;
        return (existing as Vote | undefined) ?? null;
      }
      return rows[0] as Vote;
    },

    async removeVote(participantId, criterionId) {
      const rows = await sql`
        delete from rubric_cobuilder.votes
        where participant_id = ${participantId} and criterion_id = ${criterionId}
        returning id
      `;
      return rows.length > 0;
    },

    async countVotesForParticipant(participantId, roomId) {
      const [{ count }] = await sql`
        select count(*)::int as count
        from rubric_cobuilder.votes v
        join rubric_cobuilder.criteria c on c.id = v.criterion_id
        where v.participant_id = ${participantId} and c.room_id = ${roomId}
      `;
      return count as number;
    },

    async tallySelection(code, topN = 5) {
      // this runs in a single transaction-ish block via sequential sql calls;
      // it's a best-effort — neon serverless doesn't expose txns on HTTP.
      const [room] = await sql`
        select id from rubric_cobuilder.rooms where code = ${code} limit 1
      `;
      if (!room) return null;
      const roomId = room.id as string;

      const requiredRows = (await sql`
        select id from rubric_cobuilder.criteria
        where room_id = ${roomId} and required = true
      `) as Array<{ id: string }>;

      const totalPossibleRow = await sql`
        select count(*)::int * 3 as total
        from rubric_cobuilder.participants
        where room_id = ${roomId}
      `;
      const totalPossible = (totalPossibleRow[0]?.total as number) ?? 0;
      const threshold = Math.max(1, Math.ceil(totalPossible * 0.3));

      const ranked = (await sql`
        select c.id, count(v.id)::int as vote_count
        from rubric_cobuilder.criteria c
        left join rubric_cobuilder.votes v on v.criterion_id = c.id
        where c.room_id = ${roomId} and c.required = false
        group by c.id
        order by vote_count desc, c.position asc
      `) as Array<{ id: string; vote_count: number }>;

      const picked = new Set<string>(requiredRows.map((r) => r.id));
      for (const r of ranked) {
        if (picked.size >= topN) break;
        if (r.vote_count >= threshold) picked.add(r.id);
      }
      if (picked.size === requiredRows.length) {
        for (const r of ranked.slice(0, Math.min(3, topN - picked.size))) {
          picked.add(r.id);
        }
      }

      const pickedArr = [...picked];
      // mark selected + rejected
      await sql`
        update rubric_cobuilder.criteria
        set status = 'rejected'
        where room_id = ${roomId}
      `;
      if (pickedArr.length > 0) {
        // assign position by current order, then mark selected
        for (let i = 0; i < pickedArr.length; i++) {
          await sql`
            update rubric_cobuilder.criteria
            set status = 'selected', position = ${i}
            where id = ${pickedArr[i]}
          `;
        }
      }

      // seed scale descriptors
      for (const id of pickedArr) {
        for (const { level } of SCALE_LEVELS) {
          await sql`
            insert into rubric_cobuilder.scales (criterion_id, level, descriptor)
            values (${id}, ${level}, ${DEFAULT_DESCRIPTORS[level]})
            on conflict (criterion_id, level) do nothing
          `;
        }
      }

      const selected = (await sql`
        select id, room_id, name, good_description, failure_description,
               source, required, status, position, created_at
        from rubric_cobuilder.criteria
        where room_id = ${roomId} and status = 'selected'
        order by position asc
      `) as Criterion[];
      const scales = (await sql`
        select s.id, s.criterion_id, s.level, s.descriptor, s.updated_at
        from rubric_cobuilder.scales s
        join rubric_cobuilder.criteria c on c.id = s.criterion_id
        where c.room_id = ${roomId} and c.status = 'selected'
        order by s.level asc
      `) as Scale[];

      return { selected, scales };
    },

    async upsertScaleDescriptor(criterionId, level, descriptor) {
      const [row] = await sql`
        insert into rubric_cobuilder.scales (criterion_id, level, descriptor)
        values (${criterionId}, ${level}, ${descriptor})
        on conflict (criterion_id, level) do update
          set descriptor = excluded.descriptor, updated_at = now()
        returning id, criterion_id, level, descriptor, updated_at
      `;
      return row as Scale;
    },

    async submitCalibrationScore(participantId, criterionId, level) {
      const [row] = await sql`
        insert into rubric_cobuilder.calibration_scores
          (participant_id, criterion_id, level)
        values (${participantId}, ${criterionId}, ${level})
        on conflict (participant_id, criterion_id) do update
          set level = excluded.level, created_at = now()
        returning id, participant_id, criterion_id, level, created_at
      `;
      return row as CalibrationScore;
    },

    async castAiVote(participantId, roomCode, level) {
      const [room] = await sql`
        select id from rubric_cobuilder.rooms where code = ${roomCode} limit 1
      `;
      if (!room) return null;
      const [row] = await sql`
        insert into rubric_cobuilder.ai_use_votes (participant_id, room_id, level)
        values (${participantId}, ${room.id}, ${level})
        on conflict (participant_id, room_id) do update
          set level = excluded.level, created_at = now()
        returning id, participant_id, room_id, level, created_at
      `;
      return row as AiUseVote;
    },

    async tallyAiLadder(code) {
      const [room] = await sql`
        select id from rubric_cobuilder.rooms where code = ${code} limit 1
      `;
      if (!room) return null;
      const rows = (await sql`
        select level, count(*)::int as count
        from rubric_cobuilder.ai_use_votes
        where room_id = ${room.id}
        group by level
      `) as Array<{ level: number; count: number }>;
      const counts: Record<AiUseLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const r of rows) counts[r.level as AiUseLevel] = r.count;
      let ceiling: AiUseLevel = 0;
      let best = -1;
      for (const lvl of [0, 1, 2, 3, 4] as AiUseLevel[]) {
        if (counts[lvl] > best) {
          best = counts[lvl];
          ceiling = lvl;
        }
      }
      return { ceiling, counts };
    },

    async upsertPledgeSlot(roomCode, slotIndex, content) {
      const [room] = await sql`
        select id from rubric_cobuilder.rooms where code = ${roomCode} limit 1
      `;
      if (!room) return null;
      const [row] = await sql`
        insert into rubric_cobuilder.pledge_slots (room_id, slot_index, content)
        values (${room.id}, ${slotIndex}, ${content})
        on conflict (room_id, slot_index) do update
          set content = excluded.content, updated_at = now()
        returning id, room_id, slot_index, content, updated_at
      `;
      return row as PledgeSlot;
    },
  };
}

// ---------- factory ----------

const globalForStore = globalThis as unknown as { __rcbStore?: Store };
let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.POSTGRES_URL;
  if (url) {
    cached = neonStore(url);
    // eslint-disable-next-line no-console
    console.log("[rubric-co-builder] store: neon");
  } else {
    if (!globalForStore.__rcbStore) {
      globalForStore.__rcbStore = memoryStore();
      // eslint-disable-next-line no-console
      console.log(
        "[rubric-co-builder] store: in-memory (POSTGRES_URL not set — demo mode)",
      );
    }
    cached = globalForStore.__rcbStore;
  }
  return cached;
}

