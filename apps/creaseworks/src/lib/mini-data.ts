/**
 * creaseworks mini — static data snapshot.
 *
 * GENERATED from materials_cache + playdates_cache on 2026-06-11 — the mini
 * canary carries no database credential, so the picker, matcher, and
 * read-aloud instructions all run on this committed snapshot.
 * Regenerate with the script in the slice-4 / design-round commits.
 */

export interface MiniMaterial {
  id: string;
  title: string;
  emoji: string | null;
  icon: string | null;
  formPrimary: string | null;
  /**
   * Playful sensory read for the "one loud thing / one quiet thing" find hunt.
   * v1 values below are a first pass — Garrett/team correct in place.
   */
  loudQuiet?: "loud" | "quiet";
  /**
   * Layer-B verbs this material can DO — the affordance set. Powers the fold
   * job wheel (draws only verbs the picked materials afford) + the "what does
   * it want to do?" quick-pick. v1 first pass; correctable.
   */
  affords?: string[];
  /**
   * When true, the look-page tiles show the literal material icon
   * (icons/materials/<icon>.png) instead of the resolved character — for
   * materials where the cast mapping reads as confusing (e.g. a shoebox).
   */
  preferIcon?: boolean;
  /**
   * Promoted open-ended materials (B5): a bespoke-icon URL (served by the
   * eval worker) instead of the bundled icons/materials/<icon>.png, plus the
   * family/class code that discovered it (recognition — surfaced in the
   * grown-up corner, not the kid grid).
   */
  iconUrl?: string;
  discoveredBy?: string;
}

export const MINI_MATERIALS: MiniMaterial[] = [
  { id: "6626ee5c-2940-4456-bfa9-f9c40292d9ce", title: "letter tiles", emoji: "🔤", icon: "blocks", formPrimary: "discrete small parts", loudQuiet: "loud", affords: ["sort", "mark", "stack", "compare"] },
  { id: "901cf679-6f54-4d69-9270-27e649d655b0", title: "aluminum foil", emoji: "✨", icon: "aluminum-foil", formPrimary: "sheet goods / surfaces", preferIcon: true, loudQuiet: "loud", affords: ["wrap", "transform", "contain", "mark"] },
  { id: "286b196d-47af-418a-b38e-8e5c98161964", title: "big paper", emoji: "📄", icon: null, formPrimary: "sheet goods / surfaces", loudQuiet: "quiet", affords: ["mark", "wrap", "divide", "contain"] },
  { id: "32d7affb-0bf2-498f-8c50-fe18c014462b", title: "binder clips", emoji: "📎", icon: "binder-clips", formPrimary: "discrete small parts", loudQuiet: "loud", affords: ["join", "carry", "sort"] },
  { id: "0ee41324-7185-4acd-a19f-178fbc1a3643", title: "bottle caps", emoji: "⭕", icon: "bottle-cap", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["sort", "stack", "contain", "launch"] },
  { id: "fd14731e-7e63-4bf2-bb77-1c2e1985a8bf", title: "buttons", emoji: "🔘", icon: "buttons", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["sort", "join", "mark", "compare"] },
  { id: "2af60a51-70ed-4df5-86fc-7a31bb0d38b0", title: "cardboard tubes", emoji: "🌀", icon: "cardboard-tube", formPrimary: "volumes / substrates", preferIcon: true, loudQuiet: "quiet", affords: ["launch", "carry", "roll", "contain"] },
  { id: "55f0bf70-da2e-4824-8972-082ddac74453", title: "cardstock", emoji: "📋", icon: null, formPrimary: "sheet goods / surfaces", loudQuiet: "quiet", affords: ["mark", "divide", "stack", "wrap"] },
  { id: "48edb12c-b71a-44a4-9d7f-2ad198c92072", title: "cloth scraps", emoji: "🧵", icon: null, formPrimary: "sheet goods / surfaces", loudQuiet: "quiet", affords: ["wrap", "wear", "hide", "join"] },
  { id: "213e9e42-5c3d-4518-a4d0-4bd7e8f4ae88", title: "clothespins", emoji: "🪹", icon: "clothespins", formPrimary: "discrete small parts", loudQuiet: "loud", affords: ["join", "sort", "carry"] },
  { id: "8e118c15-fefa-4dc6-9be9-73d8a7430c5e", title: "colored pencils", emoji: "🖍️", icon: "crayons", formPrimary: "mark-making media", loudQuiet: "quiet", affords: ["mark", "sort", "compare"] },
  { id: "7cae5ffa-1fd5-4ef1-9ac3-3018caf03e68", title: "craft paper", emoji: "🟧", icon: null, formPrimary: "sheet goods / surfaces", loudQuiet: "quiet", affords: ["mark", "wrap", "divide"] },
  { id: "72881eae-4246-4c77-8a01-001c77a764ae", title: "cotton balls", emoji: "☁️", icon: "cotton-balls", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["wrap", "hide", "launch", "contain"] },
  { id: "1efd83e1-c3f4-4d5b-b8a8-89ebd6885e62", title: "dice", emoji: "🎲", icon: null, formPrimary: "discrete small parts", loudQuiet: "loud", affords: ["roll", "sort", "launch", "compare"] },
  { id: "f274b4b1-9833-4ee5-8813-9b8470b75eb4", title: "egg cartons", emoji: "🥚", icon: "egg-cartons", formPrimary: "containers / vessels", loudQuiet: "quiet", affords: ["contain", "sort", "divide"] },
  { id: "4dfbdb56-3a7b-43a4-a62d-fea6eff12f4d", title: "felt sheets", emoji: "🧶", icon: "felt", formPrimary: "sheet goods / surfaces", preferIcon: true, loudQuiet: "quiet", affords: ["wear", "wrap", "mark", "divide"] },
  { id: "7ec3988e-7ea8-4dc7-a169-efbde23ab193", title: "googly eyes", emoji: "👀", icon: "googly-eyes", formPrimary: "discrete small parts", loudQuiet: "loud", affords: ["mark", "transform", "sort"] },
  { id: "nat-leaves", title: "leaves", emoji: "🍃", icon: null, formPrimary: "found objects / evocative artifacts", preferIcon: true, loudQuiet: "quiet", affords: ["mark", "wrap", "sort", "compare"] },
  { id: "10fb1bed-2028-41d0-af48-2d6297b6ccf0", title: "muffin tin", emoji: "🍱", icon: "muffin-tin", formPrimary: "containers / vessels", loudQuiet: "loud", affords: ["contain", "sort", "divide"] },
  { id: "dcb1ada7-d02d-4f8d-b8b3-07520cda0cc8", title: "old gadgets", emoji: "🔧", icon: null, formPrimary: "found objects / evocative artifacts", preferIcon: true, loudQuiet: "loud", affords: ["transform", "sound", "divide", "sort"] },
  { id: "2216d5dc-3fba-4e9f-b42f-2a3171c78997", title: "paper cups", emoji: "🥤", icon: "paper-cups", formPrimary: "containers / vessels", preferIcon: true, loudQuiet: "quiet", affords: ["contain", "stack", "sound", "launch"] },
  { id: "7498e5a3-6df0-4b4e-b30f-425c10b5683f", title: "paper plates", emoji: "🍽️", icon: "paper-plates", formPrimary: "sheet goods / surfaces", preferIcon: true, loudQuiet: "quiet", affords: ["contain", "launch", "wear", "mark"] },
  { id: "f53b82a2-274a-443d-8c7d-83e0593c7a43", title: "plastic beads", emoji: "🔮", icon: "beads", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["sort", "join", "carry", "compare"] },
  { id: "2205f322-dbda-47ef-8a5e-ea461e409a7d", title: "plastic bottles", emoji: "🍶", icon: "plastic-bottle", formPrimary: "containers / vessels", loudQuiet: "loud", affords: ["contain", "launch", "sound", "transform"] },
  { id: "a59aab52-b94f-4c4f-b247-c5a0e250809b", title: "playing cards", emoji: "🃏", icon: "playing-cards", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["sort", "stack", "divide", "hide"] },
  { id: "4e661049-a4ef-420e-9c2e-b4ed8c78efa4", title: "popsicle sticks", emoji: "🍦", icon: "popsicle-sticks", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["join", "stack", "mark", "launch"] },
  { id: "31d462e2-160e-4f19-9b81-49fa43c956cb", title: "ribbon", emoji: "🎀", icon: null, formPrimary: "linear / filament", loudQuiet: "quiet", affords: ["wrap", "join", "wear", "mark"] },
  { id: "10733729-9e9a-4581-90b8-dba499749b3c", title: "rubber bands", emoji: "➰", icon: "rubber-bands", formPrimary: "linear / filament", preferIcon: true, loudQuiet: "loud", affords: ["launch", "join", "sound", "wrap"] },
  { id: "54430205-7db7-4f89-9784-dc2a8db82685", title: "shoebox", emoji: "📦", icon: "shoebox", formPrimary: "containers / vessels", preferIcon: true, loudQuiet: "quiet", affords: ["contain", "hide", "carry", "transform"] },
  { id: "ddb69f2a-6171-44f9-874c-9f2291d57934", title: "stickers", emoji: "⭐", icon: "stickers", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["mark", "join", "sort"] },
  { id: "nat-sticks", title: "sticks", emoji: "🪵", icon: null, formPrimary: "found objects / evocative artifacts", preferIcon: true, loudQuiet: "quiet", affords: ["join", "mark", "launch", "balance"] },
  { id: "nat-stones", title: "stones", emoji: "🪨", icon: null, formPrimary: "found objects / evocative artifacts", preferIcon: true, loudQuiet: "quiet", affords: ["stack", "sort", "balance", "compare"] },
  { id: "0cec69db-efb1-4ace-a82b-cea4aaeac234", title: "string / yarn", emoji: "🧶", icon: null, formPrimary: "linear / filament", loudQuiet: "quiet", affords: ["wrap", "join", "carry", "hide"] },
  { id: "42618139-245d-43d3-84f6-0b47ffe977a0", title: "tape", emoji: "🩹", icon: "tape-roll", formPrimary: "joining / fastening", loudQuiet: "quiet", affords: ["join", "wrap", "mark"] },
  { id: "8162b467-9b2d-4ad3-b4fa-5760b6b4466e", title: "toy parts", emoji: "🧩", icon: "blocks", formPrimary: "found objects / evocative artifacts", loudQuiet: "loud", affords: ["transform", "join", "sound", "sort"] },
  { id: "1fe78962-fb1b-49ae-88b0-b0573e3ef85f", title: "washable markers", emoji: "🖍️", icon: "crayons", formPrimary: "mark-making media", loudQuiet: "quiet", affords: ["mark", "sort", "compare"] },
  { id: "9fc3cdad-5220-4a5d-b255-1942c6110ae3", title: "washi tape", emoji: "🎏", icon: "washi-tape", formPrimary: "joining / fastening", loudQuiet: "quiet", affords: ["join", "mark", "wrap"] },
  { id: "5b07a6bb-e1ce-4cec-be4b-94ef5affff55", title: "white sock", emoji: "🧦", icon: "socks", formPrimary: "wearables / embodied props", loudQuiet: "quiet", affords: ["wear", "wrap", "hide", "contain"] },
  { id: "f7cefdb2-373a-400e-9412-ca1e02c3e9d5", title: "wine corks", emoji: "🍾", icon: "wine-corks", formPrimary: "discrete small parts", loudQuiet: "quiet", affords: ["stack", "sort", "launch", "join"] },
];

/** Read-aloud phase content per pilot activity (kid-toned, from notion). */
export interface MiniActivityContent {
  find: string | null;
  fold: string | null;
  unfold: string | null;
  findAgainPrompt: string | null;
}

export const MINI_ACTIVITY_CONTENT: Record<string, MiniActivityContent> = {
  // ── the 6 sampler playdates (verbatim from playdates_cache, 01 jul) ──
  "function-tag-scavenger": {
    find: "look around you right now — what do you see? find three things that are just sitting there. a cup, a pencil, a sock, a block, a spoon — whatever is nearby! grab them and put them in front of you. these three things are about to become part of something amazing.",
    fold: "now here's the fun part: give each thing a JOB. one thing is the \"launcher\" — it sends something flying. one thing is the \"holder\" — it keeps something safe. one thing is the \"roller\" — it moves across the floor. now put all three things together into one invention you can actually play with! how do the three jobs work together?",
    unfold: "show your invention to someone without telling them what it does. can they figure out the jobs just by looking at it and trying it? what clues helped them guess? what confused them? the way you arrange things TEACHES people how to use them — that's called design! try swapping the jobs around: what if the cup is the launcher instead of the holder?",
    findAgainPrompt: "keep the same three objects but give them completely different jobs. the cup was a holder — now it's a drum! the pencil was a launcher — now it's a bridge! same stuff, totally new invention.",
  },
  "kek-loop-micro-experience": {
    find: "K stands for “KNOW” — before you touch anything, say out loud what you THINK you’re about to make. “I think I’m going to make a tall tower.” or “I think this paper will fold into a bird.” say your guess! this is your prediction, and it’s okay if it’s wrong.",
    fold: "E stands for “EXPERIENCE” — now MAKE something, fast! grab paper, blocks, clay, whatever is near you. you have 30 seconds. don’t plan — just go! let your hands decide. what comes out might match your guess... or it might be completely different.",
    unfold: "K again — “KNOW” — look at what you made. was it what you predicted? probably not exactly! say out loud what ACTUALLY happened: “I said I’d make a tower, but I actually made more of a cave.” the gap between what you EXPECTED and what HAPPENED is where all the learning lives. that gap is called a SURPRISE, and surprises are your brain’s favorite way to learn.",
    findAgainPrompt: "do it again with a different material. make the same prediction — “I’ll make a tall tower” — but with something totally different. does the material change what comes out, even when you’re trying to make the same thing?",
  },
  "transfer-test-find-again": {
    find: "think of something you want to build — a bridge, a container, a tower, a tool. now pick TWO materials that are really different from each other. material A might be paper and tape. material B might be playdough and sticks. or material A is LEGO and material B is fabric and string. you need both sets ready to go.",
    fold: "first, build your idea with material A. take your time, make it work. now step back and LOOK at what you built — notice the shapes, the connections, what's strong and what's wobbly. now take a deep breath... and build the SAME idea from scratch with material B. same goal, completely different stuff!",
    unfold: "put both versions side by side. they probably look really different even though they're supposed to do the same thing! here's the deep question: did YOU think differently when you used different materials? did the paper make you fold and the playdough make you squish? the material didn't just change what you built — it changed HOW YOUR BRAIN WORKED while building it. that's wild!",
    findAgainPrompt: "keep material B but change your building idea. does material B suggest different things to build than material A did? what does each material WANT to become?",
  },
  "leaf-press-telegraph": {
    find: "go outside and collect 10 different leaves. big ones, tiny ones, pointy ones, round ones. also find a flat place to lay them out — a table, a piece of cardboard, or the sidewalk.",
    fold: "arrange your leaves into a message or a picture. can you make a face? an arrow pointing somewhere? a pattern that means something? no words allowed — just leaves and where you put them.",
    unfold: "show your leaf message to someone. what did they think it said? was it what you meant? what would you change to make it clearer?",
    findAgainPrompt: "try the same message but with sticks or stones instead of leaves. does it still work?",
  },
  "cloud-cartographer": {
    find: "grab something to draw with — a crayon, a marker, a pencil. and something to draw on. go where you can see the sky.",
    fold: "look up! pick three clouds. draw each one as fast as you can — you have 60 seconds per cloud because they're moving! give each cloud a name like it's a place on a map. \"mount fluffy.\" \"lake wisp.\"",
    unfold: "wait 20 or 30 minutes. look up again. are your clouds still there? did they change shape? did they float away? draw what you see now and compare.",
    findAgainPrompt: "this time, don't look at the sky. draw your clouds from memory. then check — how close were you?",
  },
  "shadow-tracker": {
    find: "go outside and pick something that isn't moving — a stick in the ground, a toy on the step, a shoe. grab a pencil or chalk too.",
    fold: "draw a line around the shadow right where it is. come back in one hour and draw the shadow again. it moved! where did it go?",
    unfold: "look at both lines you drew. which way did the shadow move? why do you think that happened? what do you think would happen if you came back one more hour later?",
    findAgainPrompt: "try three different things at the same time. before you go back to check, guess which shadow will move the most.",
  },
  "mend-a-stuffed-friend": {
    find: "find a stuffed animal or fabric toy that needs some love — maybe it has a torn seam, a missing eye, stuffing coming out, or it's just looking a little sad and flat. if nothing's broken, you can practice on an old sock or a scrap of fabric. gather your repair kit: needle and thread (with grown-up help!), fabric scraps, buttons, stuffing material (cotton balls, old fabric scraps, or even clean plastic bags work), scissors.",
    fold: "with a grown-up helping you with the needle, start your repair. if there's a rip, pinch the edges together and sew small stitches to close it up — it doesn't have to be perfect! in fact, the stitches can be part of the character. use colorful thread so the repair shows like a cool scar. if your friend needs new stuffing, gently push filling in through the opening before sewing it shut. missing an eye? sew on a button — maybe a DIFFERENT one that gives your friend a whole new personality!",
    unfold: "look at your mended friend. it looks different now — but different isn't worse, it's just... more interesting! every repair tells a story. in Japan there's an art called kintsugi where people fix broken pottery with gold — the cracks become the most beautiful part. your stitches are like that. here's the bigger idea: when something breaks, your first thought doesn't have to be \"throw it away.\" it can be \"how do I fix this?\" that's a superpower.",
    findAgainPrompt: "learn to sew a button onto a shirt (your own clothes need repairs too!). or try mending something that ISN'T fabric — can you tape a broken book? glue a cracked cup (not for drinking, just for holding pencils)? the mending mindset works on everything.",
  },
  "character-from-a-crease": {
    find: "take a piece of paper — any size, any color. fold it. not a specific origami fold, just... fold it however you want. fold it again. and maybe once more. now open it up and really LOOK at all the creases and lines. squint your eyes. turn the paper around. do you see a face hiding in the folds? a body? wings? a hat? the creases are like a secret map of a character waiting to be found.",
    fold: "once you see something — even just a tiny hint of a shape — grab a marker and start drawing on top of the creases. turn fold-lines into arms, legs, eyes, tails. add details: is your character happy? scared? sleepy? what are they wearing? give them a name. now refold the paper — does your character hide when it's folded? can you make a fold that shows just their face peeking out?",
    unfold: "you just did something amazing: you found a character that didn't exist until you LOOKED for it. that's what artists do — they find shapes in things and bring them to life. try it again with a different fold. try crumpling the paper instead of folding it — do crumple-lines make different characters than fold-lines? what about tearing the paper? every kind of mark tells a different story.",
    findAgainPrompt: "try finding characters in other things: cracks in the sidewalk, patterns in wood grain, shapes in clouds. bring a marker outside and draw faces on leaves! or fold fabric instead of paper — do cloth folds make different characters?",
  },
  "design-a-rule-not-an-object": {
    find: "gather a handful of small things — blocks, buttons, toys, whatever — and put them on a table or flat surface. also grab something to write with and write on (paper and marker, or a sticky note).",
    fold: "here's your challenge: DON'T build anything! instead, write ONE rule that changes how people can play with the things on the table. examples: \"you can only move things by blowing on them.\" or \"everything must be touching at least one other thing.\" or \"you have to close your eyes before you pick something up.\" write your rule down, then TRY playing with it! see what happens.",
    unfold: "did your rule make things easier or harder? more fun or more frustrating? show your rule to someone else and let THEM try. where did the rule work perfectly? where did it break or get confusing? the amazing thing about rules is: you didn't change the objects at all, but the rule made them feel like COMPLETELY different materials! game designers do this all the time — the rules ARE the game.",
    findAgainPrompt: "rewrite your rule to make it SIMPLER — can someone start playing in less than 30 seconds? the best rules are easy to learn but hard to master.",
  },
  "function-swap-same-form": {
    find: "grab a pile of small things that all look kind of the same — a bunch of buttons, a stack of coins, some LEGO bricks, a handful of pebbles, some bottle caps. you want about 10-15 pieces that are all similar. spread them out in front of you.",
    fold: "you're going to play three rounds with the SAME pieces, but each round has a different mission. round 1: make your pieces TELL A STORY — arrange them into a picture or a scene. round 2: scramble them up, then ORGANIZE them — sort them into groups by size, color, or some rule you invent. round 3: scramble again, then make them EXPLAIN something — like how to get from the kitchen to your bedroom, or what you ate today.",
    unfold: "you used the exact same pieces all three times, but they DID three completely different things! which round was easiest? which was hardest? did you have to invent new rules for each round? the secret is: ANY material can do almost anything — it depends on the RULES you give it, not what the material actually is.",
    findAgainPrompt: "play one more round but with a new challenge: this time you can't touch the pieces with your hands! use a spoon, chopsticks, or blow on them to move them. how does THAT change what you can make?",
  },
  "take-apart-archaeology": {
    find: "find something broken or old that nobody needs anymore — a dead remote control, a broken clock, an old keyboard, a busted toy, a used-up flashlight. ask a grown-up: \"can I take this apart?\" once you get the okay, gather your tools: a screwdriver (the little kind), pliers if you have them, and a tray or plate to put the pieces on. safety first: no batteries in your mouth, and grown-ups should handle anything sharp!",
    fold: "start unscrewing and opening things up. go slowly — you're like an archaeologist digging up a buried city! lay each piece out on your tray as you remove it. what do you see inside? wires? gears? a tiny motor? a circuit board with paths like a little road map? try to figure out what each part DOES. the spring makes something bounce. the switch opens and closes a path for electricity. the gear turns another gear.",
    unfold: "now you have a tray full of parts from inside a machine. here's the big question: can you figure out how they all worked TOGETHER? try drawing a map of how the pieces connect. and here's a wild challenge: can you use any of these parts to build something NEW? a gear becomes a wheel for a tiny car. a spring becomes a launcher. the circuit board becomes a piece of robot art. taking things apart isn't breaking them — it's learning their secrets.",
    findAgainPrompt: "take apart TWO different things and compare their insides. do they share any of the same parts? can you combine parts from different objects into one new invention? or try drawing what you THINK is inside something before you open it, then compare your guess to reality!",
  },
};

/**
 * P0.3/P0.4/P0.5 content per playdate — v1 AUTO-DRAFTED 02 jul, FLAGGED FOR TEAM EDIT.
 *   scaffold   — the four fold buttons (tell me more / less please / I'm stuck / spark me)
 *   provocations — rotating layer-3 questions on unfold; flip-only, nothing captured
 *   chain      — the "where this leads" recommendation (the 11-entry chain table)
 */
export interface MiniActivityExtras {
  scaffold: { tellMore: string; lessPlease: string; stuck: string; sparkMe: string };
  provocations: string[];
  chain: { toSlug: string; note: string };
  /** P1.2 optional per-playdate override for the three doors (build/break/story).
   *  Omitted → ThreeDoors uses the generic invitations. Flagged for team enrichment. */
  doors?: { build: string; break: string; story: string };
}

export const MINI_ACTIVITY_EXTRAS: Record<string, MiniActivityExtras> = {
  "character-from-a-crease": {
    scaffold: {
      tellMore: "look for TWO characters in the same paper — do they know each other?",
      lessPlease: "just find one shape. two eyes is enough to start.",
      stuck: "turn the paper sideways and squint. the first line you notice is an arm — go from there.",
      sparkMe: "give your character a superpower that comes straight from a fold.",
    },
    provocations: ["before this was paper, where did it come from — a tree? a factory?", "who folds paper for a living?", "what other flat things hide shapes — maps, leaves, your own hand?"],
    chain: { toSlug: "mend-a-stuffed-friend", note: "your character needs a body — or a repair." },
  },
  "function-swap-same-form": {
    scaffold: {
      tellMore: "add a 4th round: make the same pieces HIDE a secret.",
      lessPlease: "just do two rounds — tell a story, then sort.",
      stuck: "dump them out and start with whichever round sounds most fun.",
      sparkMe: "give the pieces a job they'd hate — a pebble that has to fly.",
    },
    provocations: ["where do buttons and caps come from before they're 'stuff'?", "who decides what an object is 'for'?", "what's something at home that already has more than one job?"],
    chain: { toSlug: "design-a-rule-not-an-object", note: "you changed the pieces' jobs — now change the rules." },
  },
  "design-a-rule-not-an-object": {
    scaffold: {
      tellMore: "write a SECOND rule that fights the first one.",
      lessPlease: "one tiny rule is plenty — like 'only use one finger.'",
      stuck: "start with 'you can't ___' — what's the most annoying thing to ban?",
      sparkMe: "make a rule that only works if two people play.",
    },
    provocations: ["who makes the rules for the games you already play?", "what's a rule at home you'd change?", "can a rule be unfair on purpose and still be fun?"],
    chain: { toSlug: "function-swap-same-form", note: "your rule wants new pieces." },
  },
  "take-apart-archaeology": {
    scaffold: {
      tellMore: "trace one wire all the way from start to end — where does it go?",
      lessPlease: "just open it and lay out five parts. that's enough.",
      stuck: "find the part that moves. start there.",
      sparkMe: "turn one part into something it was never meant to be.",
    },
    provocations: ["who built this, and where?", "before it broke, whose was it?", "where do the parts go when a thing is thrown away?"],
    chain: { toSlug: "function-swap-same-form", note: "the parts tray becomes your pieces." },
  },
  "mend-a-stuffed-friend": {
    scaffold: {
      tellMore: "add something NEW while you fix it — a pocket, a cape, a spare button eye.",
      lessPlease: "one stitch, or just a button. done is done.",
      stuck: "pinch the torn edges together first — the sewing just holds your pinch.",
      sparkMe: "make the repair the best part — gold thread, a mismatched eye.",
    },
    provocations: ["who made this toy, far away?", "what else in your house could be fixed instead of tossed?", "why do we throw broken things away?"],
    chain: { toSlug: "take-apart-archaeology", note: "you fixed one — now see inside another." },
  },
  "function-tag-scavenger": {
    scaffold: {
      tellMore: "add a 4th object with a job the other three need.",
      lessPlease: "two objects and two jobs is plenty.",
      stuck: "pick the launcher first — everything else reacts to it.",
      sparkMe: "give one object a SECRET second job.",
    },
    provocations: ["who decided a cup is 'for drinking'?", "what near you has a hidden job?", "where do everyday objects come from before they're yours?"],
    chain: { toSlug: "transfer-test-find-again", note: "you gave things jobs — now build the same idea from totally different stuff." },
  },
  "kek-loop-micro-experience": {
    scaffold: {
      tellMore: "make three fast versions, not one — which surprised you most?",
      lessPlease: "one guess, one make, one look. that's the whole loop.",
      stuck: "say your guess out loud FIRST — then let your hands go.",
      sparkMe: "guess something you're sure is impossible, then try it anyway.",
    },
    provocations: ["when did a surprise teach you something real?", "do grown-ups guess-and-check too?", "what job is all about trying fast and being wrong a lot?"],
    chain: { toSlug: "cloud-cartographer", note: "you guessed and checked — now guess what the sky will do." },
  },
  "transfer-test-find-again": {
    scaffold: {
      tellMore: "build a THIRD version with a material you'd never pick.",
      lessPlease: "just build it twice — A, then B.",
      stuck: "copy version A's shape in material B, then let it change on its own.",
      sparkMe: "let material B win — build what IT wants, not your plan.",
    },
    provocations: ["why does the same idea feel different in different stuff?", "who has to build the same thing many ways — engineers? cooks?", "what material does your favorite thing wish it was made of?"],
    chain: { toSlug: "function-swap-same-form", note: "same idea, new stuff — now same stuff, new jobs." },
  },
  "leaf-press-telegraph": {
    scaffold: {
      tellMore: "make a whole sentence, not just one message.",
      lessPlease: "one leaf-shape that means one thing.",
      stuck: "start with an arrow — everyone can read an arrow.",
      sparkMe: "invent a leaf-alphabet only your family knows.",
    },
    provocations: ["how did people send messages before phones?", "where did these leaves grow?", "what in nature already sends signals — bees, birds, flowers?"],
    chain: { toSlug: "shadow-tracker", note: "you made a message outside — now track what the sun draws." },
  },
  "cloud-cartographer": {
    scaffold: {
      tellMore: "draw the whole sky as a map, with roads between the clouds.",
      lessPlease: "one cloud, one name. done.",
      stuck: "don't draw it perfectly — draw it FAST, before it moves.",
      sparkMe: "predict where your cloud will be in ten minutes, then check.",
    },
    provocations: ["who needs to read clouds for their job?", "where does a cloud go when it leaves?", "what else changes shape while you watch — shadows, water, you?"],
    chain: { toSlug: "shadow-tracker", note: "you mapped the sky — now map a shadow over time." },
  },
  "shadow-tracker": {
    scaffold: {
      tellMore: "track the same shadow all day — draw a whole fan of lines.",
      lessPlease: "two lines, one hour apart. that's the whole thing.",
      stuck: "pick something that won't move, and mark the very tip of its shadow.",
      sparkMe: "guess where the shadow will be at dinner, then check.",
    },
    provocations: ["what makes the shadow move — the shadow, the sun, or the earth?", "who used shadows to tell time before clocks?", "where is your shadow at night?"],
    chain: { toSlug: "cloud-cartographer", note: "you tracked the sun's shadow — now track the clouds." },
  },
};
