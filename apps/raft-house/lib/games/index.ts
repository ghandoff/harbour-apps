import type { Activity } from "../types";

// ── mathematics ──
import { foldSpace, infinityHotel, variableEngine, proofGarden, patternWeave } from "./mathematics";

// ── computer science ──
import { raceCondition, typeTower, stateCraft, signalFlow, codeWeave } from "./computer-science";

// ── physics ──
import { frameShift, entropyGarden, fieldCanvas, orbitLab, timePrism } from "./physics";

// ── biology ──
import { selectionPressure, expressIon, webPulse, emergeBox } from "./biology";

// ── chemistry ──
import { bondCraft, equilibriumDance, reactionPath } from "./chemistry";

// ── economics ──
import { marginCall, tradeWinds, commonsGame, scaleShift, marketMind } from "./economics";

// ── psychology ──
import { mirrorMaze, anchorDrift, storySelf, biasLens, paleBlue } from "./psychology";

// ── philosophy ──
import { oughtMachine, circleRead, lensShift, liminalPass } from "./philosophy";

// ── music ──
import { toneField, voiceWeave, soundColor, rhythmLab } from "./music";

// ── visual arts ──
import { spaceBetween, hueShift, gridBreak } from "./visual-arts";

// ── writing ──
import { readerGhost, draftLoop, genreShift } from "./writing";

// ════════════════════════════════════════════════════════════════════════
// UI metadata types — colocated with the game registry so that the
// Discover page (app/page.tsx) and any future surfaces (CLI generator,
// session-builder picker, etc.) consume ONE source of truth instead of
// shadowing it with their own arrays.
//
// Prior to this consolidation, app/page.tsx maintained its own GAMES
// array that had to be manually kept in sync with GAME_REGISTRY here.
// Drift produced two failure modes:
//   - Name in GAMES but not in GAME_REGISTRY → URL launch silently
//     produces an empty Activity[] (room never leaves the lobby).
//   - Name in GAME_REGISTRY but not in GAMES → the game is unreachable
//     from the Discover page even though its content exists.
// Neither failure was catchable at build time.
// ════════════════════════════════════════════════════════════════════════

export type Energy = "contemplative" | "energized" | "playful";
export type Social = "solo" | "collaborative" | "asymmetric";
export type Temporality = "real-time" | "turn-based" | "time-pressure" | "async" | "paced";

export interface GameMechanics {
  /** input modality — gesture, drag, typing, drawing, etc. */
  input: string;
  /** agency framing — "you build", "you observe", "you are the system" */
  agency: string;
  /** the verb-arrow-verb summary of the core game loop */
  coreLoop: string;
  temporality: Temporality;
  /** one-word action verb shown on badges */
  verb: string;
  /** badge accent color */
  color: string;
}

export interface GameDescriptor {
  /** unique game name — also the URL `?game=` param value and DO room launch seed */
  name: string;
  /** activity factory — pure function from name → Activity[] */
  factory: () => Activity[];
  /** emoji icon shown on game cards + rafts */
  icon: string;
  /** discipline key — see DISC_LABELS in app/page.tsx for display names */
  disc: string;
  energy: Energy;
  social: Social;
  /** short marketing description for the discover cards */
  desc: string;
  mechanics: GameMechanics;
}

// Verb → accent color map. The mechanics.color field references this map.
// Adding a new verb means adding a new entry here; otherwise the color falls
// back to undefined (handled gracefully in the UI).
const VERB_COLORS: Record<string, string> = {
  fold: "#8b5cf6",
  manage: "#ef4444",
  wire: "#f59e0b",
  grow: "#22c55e",
  weave: "#06b6d4",
  sync: "#3b82f6",
  stack: "#f97316",
  diagram: "#0d9488",
  route: "#ec4899",
  solve: "#d97706",
  shift: "#6366f1",
  tend: "#22c55e",
  paint: "#3b82f6",
  orbit: "#8b5cf6",
  split: "#9333ea",
  steer: "#ef4444",
  decode: "#06b6d4",
  balance: "#f59e0b",
  trigger: "#ec4899",
  bond: "#9333ea",
  dance: "#f97316",
  trace: "#0d9488",
  trade: "#dc2626",
  vote: "#3b82f6",
  scale: "#d97706",
  model: "#6366f1",
  navigate: "#8b5cf6",
  anchor: "#ef4444",
  narrate: "#06b6d4",
  lens: "#ec4899",
  build: "#f59e0b",
  read: "#0d9488",
  inhabit: "#9333ea",
  cross: "#d97706",
  compose: "#3b82f6",
  polyphony: "#ec4899",
  map: "#6366f1",
  jam: "#f97316",
  see: "#22c55e",
  copaint: "#06b6d4",
  sketch: "#ef4444",
  haunt: "#8b5cf6",
  revise: "#0d9488",
  rewrite: "#d97706",
  survive: "#ef4444",
  predict: "#f59e0b",
  gaze: "#6366f1",
};

// ════════════════════════════════════════════════════════════════════════
// The catalogue — 46 games, single source of truth.
// Each entry's `factory` is a pure Activity[] generator (the seed referenced
// by the URL-param launch flow in app/facilitate/live/[code]/page.tsx).
// ════════════════════════════════════════════════════════════════════════

export const GAMES: GameDescriptor[] = [
  // ── mathematics ──
  { name: "fold.space", factory: foldSpace, icon: "📐", disc: "mathematics", energy: "playful", social: "solo",
    desc: "gestural origami — drag-to-fold with crease physics, reveal hidden geometric structures",
    mechanics: { input: "gesture", agency: "you build", coreLoop: "fold→crease→reveal", temporality: "paced", verb: "fold", color: VERB_COLORS.fold } },
  { name: "infinity.hotel", factory: infinityHotel, icon: "🏨", disc: "mathematics", energy: "energized", social: "asymmetric",
    desc: "frantic logistics — drag guests between rooms under escalating arrivals. comedy management sim",
    mechanics: { input: "drag", agency: "you manage", coreLoop: "assign→overflow→rearrange", temporality: "time-pressure", verb: "manage", color: VERB_COLORS.manage } },
  { name: "variable.engine", factory: variableEngine, icon: "⚙️", disc: "mathematics", energy: "energized", social: "collaborative",
    desc: "rube goldberg wiring — chain physical cause-effect machines with algebraic constraints",
    mechanics: { input: "drag", agency: "you wire", coreLoop: "chain→trigger→observe", temporality: "paced", verb: "wire", color: VERB_COLORS.wire } },
  { name: "proof.garden", factory: proofGarden, icon: "🌿", disc: "mathematics", energy: "contemplative", social: "solo",
    desc: "plant axiom seeds, drag to connect, watch proof trees bloom into theorems",
    mechanics: { input: "drag", agency: "you tend", coreLoop: "plant→connect→bloom", temporality: "paced", verb: "grow", color: VERB_COLORS.grow } },
  { name: "pattern.weave", factory: patternWeave, icon: "🧶", disc: "mathematics", energy: "contemplative", social: "solo",
    desc: "click regions to find hidden patterns, reverse-engineer the rule, then compose new ones",
    mechanics: { input: "mouse/touch", agency: "you investigate", coreLoop: "find→reverse→compose", temporality: "paced", verb: "weave", color: VERB_COLORS.weave } },

  // ── computer science ──
  { name: "race.condition", factory: raceCondition, icon: "🏁", disc: "cs", energy: "energized", social: "collaborative",
    desc: "PvP shared-resource race — two players cause real race conditions, not just observe them",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "grab→conflict→deadlock", temporality: "real-time", verb: "race", color: VERB_COLORS.sync } },
  { name: "type.tower", factory: typeTower, icon: "🗼", disc: "cs", energy: "playful", social: "solo",
    desc: "physical block-stacking — shaped blocks only fit compatible types. tactile tetris/jenga hybrid",
    mechanics: { input: "drag", agency: "you build", coreLoop: "stack→check→balance", temporality: "paced", verb: "stack", color: VERB_COLORS.stack } },
  { name: "state.craft", factory: stateCraft, icon: "🤖", disc: "cs", energy: "contemplative", social: "solo",
    desc: "escape room — you're trapped inside a state machine. discover transitions to escape",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "explore→trigger→escape", temporality: "paced", verb: "escape", color: VERB_COLORS.diagram } },
  { name: "signal.flow", factory: signalFlow, icon: "📡", disc: "cs", energy: "energized", social: "collaborative",
    desc: "wire boxes together, observe signal propagation, rewire under pressure before overflow",
    mechanics: { input: "drag", agency: "you wire", coreLoop: "wire→observe→rewire", temporality: "real-time", verb: "route", color: VERB_COLORS.route } },
  { name: "code.weave", factory: codeWeave, icon: "🧬", disc: "cs", energy: "energized", social: "solo",
    desc: "drag code blocks, step through execution, debug the weave when threads tangle",
    mechanics: { input: "drag", agency: "you build", coreLoop: "program→run→debug", temporality: "paced", verb: "debug", color: VERB_COLORS.solve } },

  // ── physics ──
  { name: "frame.shift", factory: frameShift, icon: "🌌", disc: "physics", energy: "playful", social: "asymmetric",
    desc: "split-screen asymmetric co-op — same events, different reference frames. reconcile to solve",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "observe→compare→reconcile", temporality: "turn-based", verb: "shift", color: VERB_COLORS.shift } },
  { name: "entropy.garden", factory: entropyGarden, icon: "🌱", disc: "physics", energy: "contemplative", social: "solo",
    desc: "tamagotchi nurture — keep order alive against constant decay. emotional attachment, inevitable loss",
    mechanics: { input: "mouse/touch", agency: "you tend", coreLoop: "nurture→decay→grieve", temporality: "time-pressure", verb: "tend", color: VERB_COLORS.tend } },
  { name: "field.canvas", factory: fieldCanvas, icon: "🧲", disc: "physics", energy: "playful", social: "collaborative",
    desc: "collaborative painting — place charges to paint with field lines. gallery mode, save & share",
    mechanics: { input: "drawing", agency: "you paint", coreLoop: "place→paint→share", temporality: "real-time", verb: "paint", color: VERB_COLORS.paint } },
  { name: "orbit.lab", factory: orbitLab, icon: "🪐", disc: "physics", energy: "playful", social: "solo",
    desc: "launch→observe→adjust: aim and thrust to design stable orbital systems",
    mechanics: { input: "mouse/touch", agency: "you build", coreLoop: "launch→observe→adjust", temporality: "real-time", verb: "orbit", color: VERB_COLORS.orbit } },
  { name: "time.prism", factory: timePrism, icon: "🔮", disc: "physics", energy: "contemplative", social: "solo",
    desc: "branching narrative — read, decide, compare timelines. solo paced story",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "read→decide→compare", temporality: "paced", verb: "branch", color: VERB_COLORS.split } },

  // ── biology ──
  { name: "selection.pressure", factory: selectionPressure, icon: "🦎", disc: "biology", energy: "energized", social: "collaborative",
    desc: "indirect environmental control — can't touch organisms, only shape terrain. the frustration IS the lesson",
    mechanics: { input: "slider", agency: "you shape the environment", coreLoop: "shape→observe→adapt", temporality: "real-time", verb: "steer", color: VERB_COLORS.steer } },
  { name: "express.ion", factory: expressIon, icon: "🧬", disc: "biology", energy: "playful", social: "asymmetric",
    desc: "lock-and-key molecular manipulation — fit transcription factors to promoters. combinatorial puzzle",
    mechanics: { input: "drag", agency: "you investigate", coreLoop: "fit→test→express", temporality: "turn-based", verb: "decode", color: VERB_COLORS.decode } },
  { name: "web.pulse", factory: webPulse, icon: "🕸️", disc: "biology", energy: "contemplative", social: "collaborative",
    desc: "jenga-style species removal — pull species, see if the web holds or cascades. tension of each removal",
    mechanics: { input: "mouse/touch", agency: "you observe", coreLoop: "pull→cascade→dread", temporality: "turn-based", verb: "pull", color: VERB_COLORS.balance } },
  { name: "emerge.box", factory: emergeBox, icon: "📦", disc: "biology", energy: "energized", social: "solo",
    desc: "toggle cells, define rules, watch emergent behavior unfold in real time",
    mechanics: { input: "mouse/touch", agency: "you observe", coreLoop: "define→observe→emerge", temporality: "real-time", verb: "trigger", color: VERB_COLORS.trigger } },

  // ── chemistry ──
  { name: "bond.craft", factory: bondCraft, icon: "⚛️", disc: "chemistry", energy: "playful", social: "solo",
    desc: "3D electron cloud sculpting — shape orbitals with gestures. spatial, artistic chemistry",
    mechanics: { input: "gesture", agency: "you build", coreLoop: "sculpt→bond→test", temporality: "paced", verb: "sculpt", color: VERB_COLORS.bond } },
  { name: "equilibrium.dance", factory: equilibriumDance, icon: "🩰", disc: "chemistry", energy: "energized", social: "collaborative",
    desc: "zoom-only mechanic — only interaction is zooming between macro stillness and micro chaos. the zoom IS the threshold",
    mechanics: { input: "gesture", agency: "you zoom", coreLoop: "zoom→observe→shift", temporality: "real-time", verb: "zoom", color: VERB_COLORS.dance } },
  { name: "reaction.path", factory: reactionPath, icon: "🧪", disc: "chemistry", energy: "contemplative", social: "solo",
    desc: "marble-run platformer — you ARE the molecule navigating an energy landscape",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "traverse→climb→descend", temporality: "real-time", verb: "traverse", color: VERB_COLORS.trace } },

  // ── economics ──
  { name: "margin.call", factory: marginCall, icon: "💹", disc: "economics", energy: "energized", social: "solo",
    desc: "rapid-fire binary decisions — 'one more? yes/no' under time pressure. game-show pacing, no analysis time",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "decide→reveal→survive", temporality: "time-pressure", verb: "survive", color: VERB_COLORS.survive } },
  { name: "trade.winds", factory: tradeWinds, icon: "⛵", disc: "economics", energy: "playful", social: "asymmetric",
    desc: "async diplomacy — propose deals via messages, no direct resource control. negotiation, not allocation",
    mechanics: { input: "typing", agency: "you negotiate", coreLoop: "propose→counter→settle", temporality: "async", verb: "negotiate", color: VERB_COLORS.trade } },
  { name: "commons.game", factory: commonsGame, icon: "🌾", disc: "economics", energy: "contemplative", social: "collaborative",
    desc: "social deduction + institutional design — secret defectors, then design governance together",
    mechanics: { input: "mouse/touch", agency: "you negotiate", coreLoop: "betray→detect→govern", temporality: "turn-based", verb: "govern", color: VERB_COLORS.vote } },
  { name: "scale.shift", factory: scaleShift, icon: "⚖️", disc: "economics", energy: "playful", social: "solo",
    desc: "zoom→interact→question: pinch and scroll between micro and macro economic scales",
    mechanics: { input: "gesture", agency: "you investigate", coreLoop: "zoom→interact→question", temporality: "paced", verb: "scale", color: VERB_COLORS.scale } },
  { name: "market.mind", factory: marketMind, icon: "📈", disc: "economics", energy: "energized", social: "asymmetric",
    desc: "drag resources to allocate, trade with others, compare strategies. multiplayer competitive",
    mechanics: { input: "drag", agency: "you negotiate", coreLoop: "allocate→trade→compare", temporality: "turn-based", verb: "trade", color: VERB_COLORS.model } },

  // ── psychology ──
  { name: "mirror.maze", factory: mirrorMaze, icon: "🪞", disc: "psychology", energy: "contemplative", social: "asymmetric",
    desc: "asymmetric perception co-op — each player sees different objects in the same room",
    mechanics: { input: "mouse/touch", agency: "you investigate", coreLoop: "see→compare→reconcile", temporality: "paced", verb: "perceive", color: VERB_COLORS.navigate } },
  { name: "anchor.drift", factory: anchorDrift, icon: "⚓", disc: "psychology", energy: "energized", social: "collaborative",
    desc: "live multiplayer game show — audience polls, social comparison of biased answers",
    mechanics: { input: "mouse/touch", agency: "you perform", coreLoop: "guess→compare→cringe", temporality: "time-pressure", verb: "poll", color: VERB_COLORS.anchor } },
  { name: "story.self", factory: storySelf, icon: "📖", disc: "psychology", energy: "playful", social: "asymmetric",
    desc: "card-game narrative — deal event cards, arrange into competing autobiographies",
    mechanics: { input: "drag", agency: "you narrate", coreLoop: "draft→arrange→defend", temporality: "turn-based", verb: "draft", color: VERB_COLORS.narrate } },
  { name: "bias.lens", factory: biasLens, icon: "🔍", disc: "psychology", energy: "contemplative", social: "solo",
    desc: "choose a scenario, reveal hidden biases, reflect on what you missed. paced solo journey",
    mechanics: { input: "mouse/touch", agency: "you observe", coreLoop: "choose→reveal→reflect", temporality: "paced", verb: "lens", color: VERB_COLORS.lens } },
  { name: "pale.blue", factory: paleBlue, icon: "🌍", disc: "psychology", energy: "contemplative", social: "collaborative",
    desc: "altitude as metaphor — zoom out until borders dissolve. the overview effect as threshold crossing",
    mechanics: { input: "mouse/touch", agency: "you observe", coreLoop: "ascend→shift→return", temporality: "paced", verb: "gaze", color: VERB_COLORS.gaze } },

  // ── philosophy ──
  { name: "ought.machine", factory: oughtMachine, icon: "🤔", disc: "philosophy", energy: "energized", social: "solo",
    desc: "socratic debate engine — argue a position, AI exposes your hidden premises. adversarial dialogue",
    mechanics: { input: "typing", agency: "you build", coreLoop: "argue→expose→revise", temporality: "paced", verb: "argue", color: VERB_COLORS.build } },
  { name: "circle.read", factory: circleRead, icon: "🔄", disc: "philosophy", energy: "contemplative", social: "solo",
    desc: "detective noir investigation — each clue recontextualizes all previous clues. iterative reinterpretation",
    mechanics: { input: "mouse/touch", agency: "you investigate", coreLoop: "discover→reread→reframe", temporality: "paced", verb: "investigate", color: VERB_COLORS.read } },
  { name: "lens.shift", factory: lensShift, icon: "👓", disc: "philosophy", energy: "playful", social: "solo",
    desc: "camera filter tool — literal visual filters that hide/reveal scene elements. swap lenses to see differently",
    mechanics: { input: "mouse/touch", agency: "you observe", coreLoop: "swap→see→compare", temporality: "paced", verb: "filter", color: VERB_COLORS.inhabit } },
  { name: "liminal.pass", factory: liminalPass, icon: "🚪", disc: "philosophy", energy: "playful", social: "solo",
    desc: "mixed-mechanic meta-game — puzzle→cross→name. each level uses a different interaction",
    mechanics: { input: "mouse/touch", agency: "you are the system", coreLoop: "puzzle→cross→name", temporality: "paced", verb: "cross", color: VERB_COLORS.cross } },

  // ── music ──
  { name: "tone.field", factory: toneField, icon: "🎵", disc: "music", energy: "contemplative", social: "collaborative",
    desc: "spatial audio walk — move through a sound field, your position determines the harmony",
    mechanics: { input: "mouse/touch", agency: "you paint", coreLoop: "move→listen→harmonize", temporality: "real-time", verb: "walk", color: VERB_COLORS.compose } },
  { name: "voice.weave", factory: voiceWeave, icon: "🎼", disc: "music", energy: "playful", social: "asymmetric",
    desc: "multiplayer live performance — each player sings/plays one voice in real-time. ensemble, social pressure",
    mechanics: { input: "voice", agency: "you perform", coreLoop: "listen→enter→blend", temporality: "real-time", verb: "ensemble", color: VERB_COLORS.polyphony } },
  { name: "sound.color", factory: soundColor, icon: "🎨", disc: "music", energy: "playful", social: "solo",
    desc: "synesthesia painting — paint visuals, hear what they sound like. cross-modal, artistic",
    mechanics: { input: "drawing", agency: "you paint", coreLoop: "paint→hear→adjust", temporality: "paced", verb: "synth", color: VERB_COLORS.map } },
  { name: "rhythm.lab", factory: rhythmLab, icon: "🎶", disc: "music", energy: "playful", social: "collaborative",
    desc: "layer→subdivide→groove: tap rhythms, build emergent beats from individual contributions",
    mechanics: { input: "rhythm", agency: "you perform", coreLoop: "layer→subdivide→groove", temporality: "real-time", verb: "jam", color: VERB_COLORS.jam } },

  // ── visual arts ──
  { name: "space.between", factory: spaceBetween, icon: "◻️", disc: "visual-arts", energy: "contemplative", social: "solo",
    desc: "photography/framing game — frame scenes to compose negative space. camera viewfinder mechanic",
    mechanics: { input: "mouse/touch", agency: "you observe", coreLoop: "frame→compose→reveal", temporality: "paced", verb: "frame", color: VERB_COLORS.see } },
  { name: "hue.shift", factory: hueShift, icon: "🌈", disc: "visual-arts", energy: "playful", social: "collaborative",
    desc: "speed matching under shifting context — match colors while surroundings change. reflex + perception",
    mechanics: { input: "mouse/touch", agency: "you perform", coreLoop: "match→shift→adapt", temporality: "time-pressure", verb: "match", color: VERB_COLORS.copaint } },
  { name: "grid.break", factory: gridBreak, icon: "📏", disc: "visual-arts", energy: "energized", social: "solo",
    desc: "before/after design challenge — design without grid, then with. the contrast is the lesson",
    mechanics: { input: "drawing", agency: "you build", coreLoop: "design→constrain→compare", temporality: "paced", verb: "contrast", color: VERB_COLORS.sketch } },

  // ── writing ──
  { name: "reader.ghost", factory: readerGhost, icon: "👻", disc: "writing", energy: "playful", social: "solo",
    desc: "live AI audience — simulated readers react in real-time as you type. write into visible feedback",
    mechanics: { input: "typing", agency: "you perform", coreLoop: "type→react→adjust", temporality: "real-time", verb: "haunt", color: VERB_COLORS.haunt } },
  { name: "draft.loop", factory: draftLoop, icon: "🔁", disc: "writing", energy: "contemplative", social: "solo",
    desc: "structural x-ray surgery — paragraph blocks become moveable, game finds buried thesis",
    mechanics: { input: "drag", agency: "you build", coreLoop: "rearrange→reveal→refine", temporality: "paced", verb: "surgery", color: VERB_COLORS.revise } },
  { name: "genre.shift", factory: genreShift, icon: "📝", disc: "writing", energy: "energized", social: "asymmetric",
    desc: "constraint transformation — same facts forced into radically different templates. mad libs meets rhetoric",
    mechanics: { input: "typing", agency: "you narrate", coreLoop: "constrain→transform→compare", temporality: "time-pressure", verb: "transform", color: VERB_COLORS.rewrite } },
];

/**
 * Game registry — name → factory lookup, DERIVED from GAMES so the two
 * cannot drift. Used by the URL-param launch flow (app/facilitate/live/
 * [code]/page.tsx) and by any other surface that needs to materialise an
 * Activity[] from a game name.
 *
 * O(1) lookup. Built once at module load.
 */
export const GAME_REGISTRY: Record<string, () => Activity[]> = Object.fromEntries(
  GAMES.map((g) => [g.name, g.factory]),
);
