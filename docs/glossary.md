# glossary — plain-language reference for garrett

> this file exists so you can learn the technical vocabulary at your own pace,
> without having to stop a task and ask "what does that word mean?". when claude
> (or anyone) uses a term you don't know, it should be in here. if it isn't,
> ask — and we'll add it.
>
> **how to read an entry:** the **bold word** is the proper term to learn. the
> sentence after it is the plain-english meaning. *(you'll also hear: …)* lists
> other words people use for the same thing. "why it matters here" ties it to
> our actual setup.

---

## start here — the six that unlock everything else

if you only learn six terms first, learn these. almost every instruction uses them.

- **the terminal** — the app on your mac where you type commands and the computer
  types back. you've been using it: the line ending in `harbour %` is the
  terminal waiting for you. *(you'll also hear: the command line, the shell, the
  console, "the prompt".)*

- **a command** — one line of text you type into the terminal to make it do
  something (e.g. `git pull`). you type it, press return, it runs.

- **the repo root** — the top folder of the project on your computer. everything
  for harbour-apps lives inside it. "run this from the repo root" just means:
  make sure the terminal is sitting in that top folder before you paste. **how to
  tell:** the word right before the `%` shows your current folder — if it says
  `harbour` (your folder is `harbour-apps`), you're at the root. *(you'll also
  hear: the project root, the working directory, "cd into the repo".)*

- **git** — the system that tracks every change to the project over time, like an
  unlimited undo history that also lets several people (and several claude
  sessions) work without overwriting each other.

- **github** — the website (github.com) where the project's git history lives
  online, so your mac, my workspace, and the deploy tools all share one copy.

- **to deploy** — to push the finished code out onto the live internet so real
  visitors see the new version. until something is deployed, your changes only
  exist privately; the public site is unchanged.

---

## the terminal, in a bit more detail

- **prompt** — the bit of text the terminal shows before you type, like
  `garrettjaeger@Garretts-Mac-mini harbour %`. it tells you *who* you are, *which
  machine*, and *which folder* you're in. the `%` (or `$`) is where your typing
  goes. (different meaning from the "prompts" you write for an AI — same word,
  two worlds.)

- **to paste a command** — copy the block, click the terminal window, press
  **cmd+v**, then press **return** to run it. if a block has several lines, the
  terminal usually runs them in order automatically.

- **`cd`** — short for "change directory". it moves the terminal into a different
  folder. `cd apps/harbour` steps *into* the harbour app's folder; `cd ..` steps
  *back up* one folder.

- **a path** — the address of a file or folder, written with slashes, e.g.
  `apps/harbour/worker.ts`. a path starting from the repo root (no leading slash)
  is "relative"; one starting with `/` or `~` is "absolute".

- **a subshell — the `( ... )` wrapper** — when a command is wrapped in round
  brackets, any `cd` inside it only applies *inside* the brackets; when it
  finishes, the terminal pops back to where it started. this is why i sometimes
  wrap steps in `( … )`: it stops one step's folder-change from breaking the
  next step.

- **`--dry-run`** — a flag (an option added to a command) that means "do
  everything *except* the real action, so i can check it would work without
  actually doing it". a rehearsal.

---

## git & github — saving and sharing changes

- **a commit** — one saved snapshot of your changes, with a short message saying
  what changed. think of it as a labelled checkpoint. *(you'll also hear: "commit
  it", "a changeset".)*

- **a branch** — a separate line of work, so you can change things without
  touching the official version until you're ready. ours is called
  `claude/magic-link-signin-issue-hBSa6`. *(you'll also hear: "feature branch".)*

- **main** — the official, default branch — the version everything ultimately
  deploys from. *(you'll also hear: "the default branch", historically
  "master".)*

- **to push** — to upload your local commits from your mac up to github so they're
  shared and backed up. *(you'll also hear: "push it up".)*

- **to pull** — the reverse: to download commits from github onto your mac, so you
  have the latest. **run `git pull` before starting work** so you're not building
  on an old copy. *(you'll also hear: "pull the latest", "git pull --rebase".)*

- **a pull request (PR)** — a proposal on github to merge one branch into another,
  with a description and a place to review the changes before they go in. *(you'll
  also hear: "a PR", "open a PR", "#131" — PRs get numbers.)*

- **to merge** — to fold one branch's changes into another (usually into `main`).
  once merged, those changes are part of the official version. *(you'll also hear:
  "land it", "merge to main".)*

- **a conflict** — when two people changed the same line differently and git can't
  decide which to keep, so it asks a human. *(you'll also hear: "merge conflict".)*

---

## node, npm & dependencies — the building blocks of the apps

- **node (node.js)** — the engine that runs our javascript code outside a browser.
  the tools below all run on it.

- **npm** — node's package manager: the tool that downloads and installs the
  outside code our apps rely on. *(you'll also hear: "npm install", "the package
  manager".)*

- **a dependency** — a piece of outside code our app uses so we don't have to
  write it ourselves. *(you'll also hear: "a package", "a library", "a module".)*

- **a devDependency** — a dependency used only while *building or deploying*, never
  shipped to real visitors. this distinction matters for security: a flaw in a
  devDependency can't reach the public site. *(you'll also hear: "dev-scope".)*

- **a transitive dependency** — a dependency *of* a dependency. you didn't ask for
  it directly; something you use pulled it in. *(you'll also hear: "indirect
  dependency", "nested dep".)*

- **package.json** — the file that lists which dependencies an app wants, by name
  and rough version (e.g. `"wrangler": "^4"` means "any version 4").

- **package-lock.json (the lockfile)** — the file that records the *exact* version
  of every dependency actually installed, so every machine installs identically.
  fixing a vulnerability usually means regenerating this file. *(you'll also hear:
  "the lockfile", "lock it".)*

- **a version like `^4`** — the `^` ("caret") means "this major version, newest
  available" — so `^4` accepts 4.95, 4.97, but not 5.0. major version jumps
  (3→4, 4→5) can break things and need testing.

- **dependabot** — github's robot that watches for known security flaws in our
  dependencies and opens alerts. not every alert is a real risk for us — some are
  in devDependencies (can't reach the public site) or already fixed in the version
  we have. *(you'll also hear: "dependabot alert", "advisory", "CVE", "severity".)*

- **a build** — turning our human-written source code into the optimised bundle a
  server actually runs. *(you'll also hear: "compile", "bundle".)*

---

## deploying this project (the cloudflare side)

- **cloudflare workers** — the service most of our apps run on live. each app is a
  "worker". *(you'll also hear: "CF Workers", "the worker".)*

- **wrangler** — cloudflare's command-line tool for deploying workers. (this is the
  `wrangler` you keep seeing — it's deploy plumbing, a devDependency.)

- **opennextjs-cloudflare** — the tool that converts our next.js apps into the
  shape cloudflare workers expects, then can deploy them.

- **worker.ts** — a small custom file some apps have that wraps the deployed app to
  add security headers and a few advanced bits. **important quirk:** apps that have
  this file must be deployed with `wrangler deploy`, *not*
  `opennextjs-cloudflare deploy`, or those extras get silently dropped. (this is
  the trap we caught for harbour.)

- **a secret** — a private value (password, API key) stored on the server, never
  written into the code. *(you'll also hear: "env var", "environment variable".)*

- **security headers / CSP** — invisible instructions a site sends with every page
  telling the browser how to stay safe (e.g. which scripts are allowed). "CSP" =
  content security policy. losing these doesn't break the page visually, which is
  why dropping them is easy to miss.

---

## sign-in & the web (what this whole task was about)

- **a magic link** — signing in by clicking a one-time link emailed to you, instead
  of typing a password.

- **OAuth** — signing in via another account ("continue with google"). *(you'll
  also hear: "google sign-in", "social login".)*

- **apex vs www** — `windedvertigo.com` is the "apex" (bare) domain;
  `www.windedvertigo.com` is the "www" version. they can behave as different
  addresses, which is exactly what broke harbour sign-in: emails pointed at one,
  the sign-in expected the other.

- **canonical host** — the single official address a system insists on using, so
  links and logins all line up. our fix pinned harbour's canonical host to the
  apex.

- **redirect_uri** — the address an OAuth provider (google) is allowed to send you
  back to after sign-in. it must exactly match a pre-registered address, or
  sign-in is refused.

---

## this assistant's web workspace, and why it sometimes can't finish things

- **the sandbox** — the temporary, isolated computer this web version of claude
  runs on. it's a fresh copy of the project, thrown away when the session ends.
  *(you'll also hear: "the container", "the remote environment".)*

- **the firewall / allowlist** — a rule about which outside websites the sandbox is
  allowed to reach. ours is locked down: it can reach github, but **not**
  cloudflare or the live `windedvertigo.com`. this is why some steps (deploying,
  testing the live sign-in, installing dependencies) can only be done on *your*
  mac, not from here. *(you'll also hear: "egress", "network policy", "host not
  allowed".)*

- **why "i can't do that from here" happens** — it's almost always the firewall
  above, not a limitation of the task. when you see it, the fix is to run that one
  step locally, and i'll give you the exact, plain steps.
