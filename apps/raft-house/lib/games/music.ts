import type { Activity } from "../types";

let _id = 0;
function uid(): string {
  return `act_${++_id}_${Date.now().toString(36)}`;
}

// ── tone.field ──────────────────────────────────────────────────
// move → listen → harmonize | real-time
// spatial audio, music theory through movement

export function toneField(): Activity[] {
  return [
    {
      id: uid(),
      type: "prediction",
      phase: "encounter",
      label: "predict: consonance",
      timeLimit: 45,
      config: {
        type: "prediction",
        prediction: {
          question:
            "in western music theory, how many of the 12 possible intervals within an octave are traditionally considered consonant (pleasant/stable)?",
          type: "number",
          answer: 7,
          unit: "intervals",
        },
      },
      hints: [
        "think about which intervals feel 'at rest' versus those that create tension",
        "unison and octave both count — start from there",
      ],
      mechanic: {
        interactionModel: "reveal",
        socialStructure: "solo",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "sorting",
      phase: "struggle",
      label: "sort: interval tension",
      discussionPrompt: "the perfect 4th is controversial — consonant in most contexts but dissonant in strict counterpoint. did anyone disagree with its placement?",
      timeLimit: 120,
      config: {
        type: "sorting",
        sorting: {
          prompt:
            "drag each interval into consonant or dissonant. think about how each one feels — does it rest or does it pull?",
          cards: [
            { id: "unison", content: "unison (C→C)", hint: "the same note played together" },
            { id: "minor-2nd", content: "minor 2nd (C→Db)", hint: "one semitone apart — think jaws theme" },
            { id: "major-3rd", content: "major 3rd (C→E)", hint: "the bright opening of a major chord" },
            { id: "perfect-4th", content: "perfect 4th (C→F)", hint: "here comes the bride" },
            { id: "tritone", content: "tritone (C→F#)", hint: "the 'devil's interval' — banned in medieval music" },
            { id: "perfect-5th", content: "perfect 5th (C→G)", hint: "power chords live here" },
            { id: "minor-7th", content: "minor 7th (C→Bb)", hint: "somewhere between tension and resolution" },
            { id: "octave", content: "octave (C→C')", hint: "the same note, doubled" },
          ],
          categories: [
            { id: "consonant", label: "consonant", description: "stable, resolved, pleasant at rest" },
            { id: "dissonant", label: "dissonant", description: "tense, unstable, wants to move somewhere" },
          ],
          solution: {
            unison: "consonant",
            "minor-2nd": "dissonant",
            "major-3rd": "consonant",
            "perfect-4th": "consonant",
            tritone: "dissonant",
            "perfect-5th": "consonant",
            "minor-7th": "dissonant",
            octave: "consonant",
          },
        },
      },
      mechanic: {
        interactionModel: "construction",
        socialStructure: "solo",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "canvas",
      phase: "threshold",
      label: "map: spatial harmony",
      timeLimit: 180,
      discussionPrompt:
        "where did the group place most of their notes — in the bass foundation, the harmonic center, or the melodic space? what does that tell you about how the group hears richness?",
      config: {
        type: "canvas",
        canvas: {
          prompt:
            "place notes on the harmony map. imagine you're arranging instruments in a room — where would each voice sit to create the richest sound? think about how pauline oliveros described 'deep listening' as spatial awareness of sound.",
          width: 800,
          height: 600,
          xLabel: "pitch",
          yLabel: "brightness",
          xLow: "low",
          xHigh: "high",
          yLow: "shimmering",
          yHigh: "dark",
          zones: [
            { id: "bass", label: "bass foundation", x: 0, y: 400, width: 200, height: 200 },
            { id: "mid", label: "harmonic center", x: 250, y: 200, width: 300, height: 200 },
            { id: "treble", label: "melodic space", x: 550, y: 0, width: 250, height: 200 },
          ],
          multiPin: true,
          minPins: 3,
          allowNote: true,
        },
      },
      mechanic: {
        interactionModel: "sandbox",
        socialStructure: "cooperative",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "open-response",
      phase: "integration",
      label: "imagine: inner sound",
      timeLimit: 180,
      config: {
        type: "open-response",
        openResponse: {
          prompt:
            "close your eyes for a moment. imagine a chord you've never heard before — one that sits right at the edge between consonance and dissonance. describe what you hear in your imagination. what instruments play it? does it move or stay still? what color is it?",
          responseType: "text",
          anonymous: true,
        },
      },
      mechanic: {
        interactionModel: "sandbox",
        socialStructure: "anonymous",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "reflection",
      phase: "application",
      label: "reflect: resolution",
      timeLimit: 180,
      config: {
        type: "reflection",
        reflection: {
          prompt:
            "why do some combinations of notes feel resolved while others feel like they need to go somewhere? think beyond physics — what role does culture, memory, and expectation play? leonard bernstein argued that the history of music is the history of expanding what we accept as consonant. do you agree?",
          minLength: 80,
          shareWithGroup: true,
        },
      },
      mechanic: {
        interactionModel: "framing",
        socialStructure: "cooperative",
        tempo: "real-time",
      },
    },
  ];
}

// ── voice.weave ─────────────────────────────────────────────────
// listen → enter → blend | real-time
// multiplayer live vocal ensemble

export function voiceWeave(): Activity[] {
  return [
    {
      id: uid(),
      type: "prediction",
      phase: "encounter",
      label: "predict: voices in harmony",
      timeLimit: 45,
      config: {
        type: "prediction",
        prediction: {
          question:
            "what is the minimum number of independent vocal lines needed to create full four-part harmony (soprano, alto, tenor, bass)?",
          type: "choice",
          options: [
            { id: "2", label: "2 voices" },
            { id: "3", label: "3 voices" },
            { id: "4", label: "4 voices" },
            { id: "6", label: "6 voices" },
          ],
          answer: "4",
        },
      },
      hints: [
        "each part carries its own melodic line — can one voice cover two parts?",
      ],
      mechanic: {
        interactionModel: "reveal",
        socialStructure: "solo",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "asymmetric",
      phase: "struggle",
      label: "play: vocal parts",
      timeLimit: 240,
      config: {
        type: "asymmetric",
        asymmetric: {
          scenario:
            "you're building a group vocal texture inspired by meredith monk's 'dolmen music.' each person has a different vocal element. you cannot hear anyone else's part — you only know your own. after practicing alone, the facilitator will layer everyone together.",
          roles: [
            {
              id: "drone",
              label: "the drone",
              info: "you hold a single sustained note — a low hum that doesn't change. you are the ground. think of tibetan overtone singing: one note, infinite depth.",
              question: "what did it feel like to be the foundation that everyone else built upon?",
            },
            {
              id: "pulse",
              label: "the pulse",
              info: "you repeat a short rhythmic vocal pattern — a percussive syllable on a steady beat. 'ta-ka ta-ka' or 'dm dm dm.' you are the heartbeat.",
              question: "how did your rhythm shape what everyone else could do?",
            },
            {
              id: "melody",
              label: "the melody",
              info: "you sing a simple 4-note rising phrase, then pause, then repeat. choose any notes that feel right. you are the story.",
              question: "when you heard the other layers, did your melody feel different than when you sang alone?",
            },
            {
              id: "texture",
              label: "the texture",
              info: "you make atmospheric sounds — breathy whispers, tongue clicks, soft 'shh' sounds. you fill the space between the others. think of björk's vocal layering in 'medúlla.'",
              question: "how did you decide when to be present and when to leave space?",
            },
          ],
          discussionPrompt:
            "what happened when all four parts combined? did it sound like you expected? what surprised you about the blend?",
          revealPrompt:
            "the magic of ensemble singing is that the whole becomes something none of the parts predicted. bobby mcferrin calls this 'the song that wants to be sung.'",
        },
      },
      mechanic: {
        interactionModel: "performance",
        socialStructure: "asymmetric",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "poll",
      phase: "threshold",
      label: "vote: what makes blend",
      discussionPrompt: "if 'active listening' got the most votes — that's interesting because it's the only skill that's purely receptive. blending requires giving up control. who found that hardest?",
      timeLimit: 60,
      config: {
        type: "poll",
        poll: {
          question:
            "after hearing all the parts together — what do you think contributes most to voices blending well?",
          options: [
            { id: "pitch", label: "matching pitch and tuning" },
            { id: "timing", label: "shared sense of timing" },
            { id: "listening", label: "active listening to each other" },
            { id: "space", label: "leaving room for other voices" },
            { id: "vowels", label: "vowel shape and resonance" },
          ],
          allowMultiple: true,
        },
      },
      mechanic: {
        interactionModel: "framing",
        socialStructure: "cooperative",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "canvas",
      phase: "integration",
      label: "map: tension and resolution",
      timeLimit: 180,
      config: {
        type: "canvas",
        canvas: {
          prompt:
            "map the emotional arc of the vocal blend you just heard. place points to trace how the music moved between tension and resolution over time. mark the moment it 'clicked.'",
          width: 800,
          height: 400,
          xLabel: "time (beginning → end)",
          yLabel: "tension → resolution",
          zones: [
            { id: "tension", label: "high tension", x: 0, y: 0, width: 800, height: 130 },
            { id: "neutral", label: "neutral", x: 0, y: 130, width: 800, height: 140 },
            { id: "resolution", label: "deep resolution", x: 0, y: 270, width: 800, height: 130 },
          ],
          multiPin: true,
          minPins: 3,
          pinCategories: [
            { id: "tension", label: "tension", color: "#ef4444" },
            { id: "resolution", label: "resolution", color: "#10b981" },
          ],
          allowNote: true,
        },
      },
      mechanic: {
        interactionModel: "sandbox",
        socialStructure: "cooperative",
        tempo: "real-time",
      },
    },
    {
      id: uid(),
      type: "reflection",
      phase: "application",
      label: "reflect: collaborative music",
      timeLimit: 240,
      config: {
        type: "reflection",
        reflection: {
          prompt:
            "making music together requires surrendering individual control to create something collective. how is this different from other forms of collaboration? think about a time you had to blend your voice — literally or figuratively — with others. what did you gain? what did you give up?",
          minLength: 100,
          shareWithGroup: true,
        },
      },
      mechanic: {
        interactionModel: "framing",
        socialStructure: "cooperative",
        tempo: "real-time",
      },
    },
  ];
}

// ── sound.color ─────────────────────────────────────────────────
// paint → hear → adjust | paced
// synesthesia painting, cross-modal perception

export function soundColor(): Activity[] {
  return [
    {
      id: uid(),
      type: "prediction",
      phase: "encounter",
      label: "predict: synesthesia",
      timeLimit: 45,
      config: {
        type: "prediction",
        prediction: {
          question:
            "roughly what percentage of the population experiences chromesthesia — involuntarily seeing colors when hearing sounds?",
          type: "number",
          answer: 4,
          unit: "percent",
        },
      },
      hints: [
        "kandinsky, liszt, and pharrell williams all reported it",
        "it's more common than most people think but still a minority experience",
      ],
      mechanic: {
        interactionModel: "reveal",
        socialStructure: "solo",
        tempo: "paced",
      },
    },
    {
      id: uid(),
      type: "sorting",
      phase: "struggle",
      label: "sort: sound qualities",
      discussionPrompt: "there's no solution key here — this is pure cross-modal instinct. where did the group agree most? where was there no consensus? what does agreement reveal about shared perception?",
      timeLimit: 150,
      config: {
        type: "sorting",
        sorting: {
          prompt:
            "sort each sound description by its visual quality. there are no wrong answers — trust your cross-modal instincts. kandinsky believed every color had a corresponding sound. what do you believe?",
          cards: [
            { id: "cello", content: "a slow cello note, sustained", hint: "rich, warm, resonant" },
            { id: "cymbal", content: "a cymbal crash, shimmering", hint: "bright, metallic, dispersing" },
            { id: "bass-drum", content: "a deep bass drum hit", hint: "dark, heavy, grounding" },
            { id: "flute", content: "a high flute trill", hint: "light, quick, airy" },
            { id: "distortion", content: "electric guitar feedback", hint: "rough, aggressive, saturated" },
            { id: "rain", content: "rain on a tin roof", hint: "scattered, cool, percussive" },
            { id: "choir", content: "a cathedral choir sustaining one chord", hint: "vast, blended, luminous" },
            { id: "synth", content: "a low analog synth pulse", hint: "electronic, pulsing, dark" },
          ],
          categories: [
            { id: "warm", label: "warm colors", description: "reds, oranges, golds — heat and closeness" },
            { id: "cool", label: "cool colors", description: "blues, greens, silvers — distance and calm" },
            { id: "sharp", label: "sharp textures", description: "jagged, angular, high-contrast" },
            { id: "soft", label: "soft textures", description: "blurred, round, gradient" },
          ],
        },
      },
      mechanic: {
        interactionModel: "construction",
        socialStructure: "solo",
        tempo: "paced",
      },
    },
    {
      id: uid(),
      type: "canvas",
      phase: "threshold",
      label: "paint: visual sound",
      timeLimit: 180,
      config: {
        type: "canvas",
        canvas: {
          prompt:
            "the facilitator will describe a sound (or play one). paint what you hear. place shapes, colors, or marks anywhere on the canvas. think like kandinsky in 'composition viii' — translate the auditory into the visual. where does the sound live in space? what shape is it?",
          width: 800,
          height: 600,
          multiPin: true,
          minPins: 3,
          pinCategories: [
            { id: "shape", label: "shape", color: "#6366f1" },
            { id: "color", label: "color", color: "#ec4899" },
            { id: "other", label: "other mark", color: "#10b981" },
          ],
          allowNote: true,
        },
      },
      mechanic: {
        interactionModel: "sandbox",
        socialStructure: "solo",
        tempo: "paced",
      },
    },
    {
      id: uid(),
      type: "open-response",
      phase: "integration",
      label: "describe: painting as sound",
      timeLimit: 180,
      config: {
        type: "open-response",
        openResponse: {
          prompt:
            "look at the image below (the facilitator will show a painting — perhaps rothko's 'no. 61' or monet's 'water lilies'). describe what this painting sounds like. what instruments? what tempo? is it loud or quiet? does it build or fade? write at least three sentences.",
          responseType: "text",
          anonymous: false,
        },
      },
      mechanic: {
        interactionModel: "sandbox",
        socialStructure: "anonymous",
        tempo: "paced",
      },
    },
    {
      id: uid(),
      type: "reflection",
      phase: "application",
      label: "reflect: cross-modal perception",
      timeLimit: 240,
      config: {
        type: "reflection",
        reflection: {
          prompt:
            "even without clinical synesthesia, we all make cross-modal associations — we say music is 'bright' or 'dark,' flavors are 'sharp' or 'smooth.' why do our senses bleed into each other? what does this tell us about how the brain builds meaning? consider how oliver messiaen composed entire symphonies based on the colors he saw in chords.",
          minLength: 80,
          shareWithGroup: true,
        },
      },
      mechanic: {
        interactionModel: "framing",
        socialStructure: "cooperative",
        tempo: "paced",
      },
    },
  ];
}

// ── rhythm.lab ──────────────────────────────────────────────────
// tap → layer → swing → groove | real-time
// the embodied threshold: you HEAR polyrhythm, you don't read about it.
//
// This experience is audio-first. Phases 1–4 use the `beat-sequencer`
// activity — a Web Audio step grid the learner taps and hears loop —
// and bridge explicitly to the standalone toy at /harbour/rhythm-lab so
// the same concept can be met as play and as practice, in either order.

const RHYTHM_LAB_TOY = { label: "open rhythm.lab →", href: "/harbour/rhythm-lab" };

export function rhythmLab(): Activity[] {
  return [
    // ── 1 · encounter — the hook (where does rhythm live?) ───────
    {
      id: uid(),
      type: "beat-sequencer",
      phase: "encounter",
      label: "feel: the pulse",
      config: {
        type: "beat-sequencer",
        beatSequencer: {
          prompt:
            "tap your desk. tap it again. now tap it faster. where does rhythm come from? press play, then drag the tempo. speed it up, slow it down — feel the pulse change in your body.",
          rows: [
            { instrument: "kick", label: "the pulse" },
            { instrument: "hihat", label: "the shimmer" },
          ],
          steps: 8,
          tempo: 96,
          tempoRange: [60, 160],
          autoplay: true,
          presets: [
            {
              id: "heartbeat",
              label: "a heartbeat",
              grid: [
                [true, false, false, false, true, false, false, false], // kick on 1 & 3
                [true, false, true, false, true, false, true, false], // hihat steady
              ],
            },
          ],
        },
      },
      mechanic: { interactionModel: "sandbox", socialStructure: "solo", tempo: "real-time" },
    },

    // ── 2 · struggle — the productive confusion (two patterns argue) ─
    {
      id: uid(),
      type: "beat-sequencer",
      phase: "struggle",
      label: "struggle: when patterns argue",
      discussionPrompt:
        "who pushed the slider all the way to 'alive' and liked it? who wanted to pull it back to 'steady'? the discomfort is the threshold — sit with whoever felt it most.",
      config: {
        type: "beat-sequencer",
        beatSequencer: {
          prompt:
            "now a second voice joins — the snare. drag the slider from steady to alive and listen to how the snare starts to land in the cracks between the beats. does it feel wrong? good. that's the threshold. stay with it.",
          rows: [
            { instrument: "kick", label: "the pulse" },
            { instrument: "snare", label: "the surprise" },
            { instrument: "hihat", label: "the shimmer" },
          ],
          steps: 8,
          tempo: 100,
          feel: { label: "how surprising does it feel?", lowLabel: "steady", highLabel: "alive" },
          presets: [
            {
              id: "steady",
              label: "steady",
              grid: [
                [true, false, false, false, true, false, false, false], // kick 1 & 3
                [false, false, true, false, false, false, true, false], // snare backbeat 2 & 4
                [true, false, true, false, true, false, true, false], // hihat steady
              ],
            },
            {
              id: "alive",
              label: "alive",
              grid: [
                [true, false, false, true, false, false, true, false], // kick syncopated
                [false, false, true, false, false, true, false, false], // snare off the grid
                [false, true, false, true, false, true, false, true], // hihat on the off-beats
              ],
            },
          ],
        },
      },
      mechanic: { interactionModel: "sandbox", socialStructure: "solo", tempo: "real-time" },
    },

    // ── 3 · threshold — the crossing (3 against 4 becomes one) ───
    {
      id: uid(),
      type: "beat-sequencer",
      phase: "threshold",
      label: "cross: three against four",
      discussionPrompt:
        "this is a 3:4 polyrhythm — three hits against four, locking up only every twelve steps. nobody had to count. ask: when did it stop sounding like two things and start sounding like one?",
      config: {
        type: "beat-sequencer",
        beatSequencer: {
          prompt:
            "two layers now: one hits three times, the other hits four — across the same loop. press play. at first you hear two patterns arguing. let it run. somewhere it clicks into a single groove. this is what the rhythm.lab grid was doing all along — each row was a layer, and when you toggled cells you were building exactly this.",
          rows: [
            { instrument: "kick", label: "the three" },
            { instrument: "clap", label: "the four" },
          ],
          steps: 12,
          tempo: 96,
          feel: { label: "let them blend", lowLabel: "two patterns", highLabel: "one groove" },
          presets: [
            {
              id: "three-vs-four",
              label: "three against four",
              grid: [
                [true, false, false, false, true, false, false, false, true, false, false, false], // every 4 steps → 3 hits
                [true, false, false, true, false, false, true, false, false, true, false, false], // every 3 steps → 4 hits
              ],
            },
          ],
          toyLink: RHYTHM_LAB_TOY,
        },
      },
      mechanic: { interactionModel: "reveal", socialStructure: "solo", tempo: "real-time" },
    },

    // ── 4 · integration — the new ears (build a groove) ──────────
    {
      id: uid(),
      type: "beat-sequencer",
      phase: "integration",
      label: "build: with new ears",
      discussionPrompt:
        "play a few people's grooves to the group. you can hear who crossed the threshold — their patterns breathe instead of marching. name what's different out loud.",
      config: {
        type: "beat-sequencer",
        beatSequencer: {
          prompt:
            "the full kit now — four voices, sixteen steps, just like the toy. but this time you know what's hiding in the spaces. don't fill every box. build a pattern that makes you feel something. find the groove, not the grid.",
          rows: [
            { instrument: "kick", label: "kick" },
            { instrument: "snare", label: "snare" },
            { instrument: "hihat", label: "hi-hat" },
            { instrument: "clap", label: "clap" },
          ],
          steps: 16,
          tempo: 100,
          feel: { label: "how much swing?", lowLabel: "straight", highLabel: "swung" },
          presets: [
            {
              id: "a-place-to-start",
              label: "a place to start",
              grid: [
                [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], // kick 1 & 3
                [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // snare 2 & 4
                [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // hi-hat eighths
                [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // clap — yours to place
              ],
            },
          ],
          toyLink: RHYTHM_LAB_TOY,
          reflectionPrompt:
            "go back and play the rhythm.lab grid one more time. what's different now? what do you hear that you didn't hear before?",
        },
      },
      mechanic: { interactionModel: "sandbox", socialStructure: "solo", tempo: "real-time" },
    },

    // ── 5 · application — naming the threshold ───────────────────
    {
      id: uid(),
      type: "reflection",
      phase: "application",
      label: "reflect: you can't unhear it",
      timeLimit: 180,
      config: {
        type: "reflection",
        reflection: {
          prompt:
            "what you just crossed is called a threshold concept. once you hear polyrhythm — once you feel two patterns become one groove — you can't unhear it. that's how all of raft.house works: every session hides a threshold inside it. where else in your life have simple things, layered together, become something you couldn't have predicted? and which threshold do you want to cross next — tone.field (how notes lean on each other) or sound.color (when a sound has a colour)?",
          minLength: 80,
          shareWithGroup: true,
        },
      },
      mechanic: { interactionModel: "framing", socialStructure: "cooperative", tempo: "real-time" },
    },
  ];
}
