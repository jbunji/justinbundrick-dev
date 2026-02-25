---
title: "I Built a Team of AI Agents to Fix My Broken Code Migration"
description: "When my first-pass AI migration came back at 7% accuracy, I didn't panic. I built a multi-agent pipeline — an auditor, a fixer, a migrator, and me — and turned 170+ bugs into a one-day fix. Here's how."
pubDate: 2026-02-25
author: "Justin Bundrick"
---

My first AI-assisted code migration looked great. The output compiled. The structure was clean. I was feeling pretty good about myself.

Then I ran the validation.

Seven percent. That was the pass rate on the first selftest file. The second one came back at twenty-five percent. Out of hundreds of test procedures, the vast majority had issues — wrong hardware mappings, incorrect pin assignments, flipped logic patterns, scoping errors that wouldn't show up until runtime.

Gut-wrenching? Yeah. But also clarifying.

Because those numbers told me something important: **a single AI agent doing a single pass isn't enough.** The job isn't linear. Legacy code migration involves varying complexities made up of varying issues that require different kinds of thinking. Pattern matching. Deep reasoning. Structural analysis. Mechanical fixes. No single model — no single *anything* — handles all of that well.

So I stopped treating AI like a magic box and started treating it like a team.

## The Moment I Knew I Needed Multiple Agents

Here's what was happening: I'd feed a legacy source file to an AI coding assistant, give it detailed instructions and reference material, and it would produce a migrated file that *looked* right. Correct syntax, reasonable structure, proper function signatures. The kind of output that passes a casual review.

But the physics were wrong. And in hardware test code, the physics is everything.

A measurement that should reference one instrument card was pointing to another. Pin assignments that mapped to sixteen physical connections got collapsed to one. Signal patterns that needed to be all-zeros came back as all-ones. These aren't syntax errors — they're domain errors. The kind of mistakes that only surface when you understand what the code is actually *doing* at the hardware level.

One AI agent couldn't hold all of that context while simultaneously writing correct C code. The context window would get polluted with implementation details, and the big-picture understanding would drift.

I needed to separate the thinking from the doing.

## Designing the Team

I approached it the same way you'd staff a software development team. You don't hire one person and ask them to be the architect, the developer, the code reviewer, and the project manager. You hire specialists and let them focus.

**The Auditor** reads the migrated code alongside the original source and produces a detailed findings report. It doesn't fix anything. It doesn't write code. It just *thinks*. It compares structure, validates hardware mappings, checks scoping rules, and flags everything that doesn't match. I assigned this role to the heaviest reasoning model available — the kind of model that's slow and expensive, but catches things that faster models miss.

**The Fixer** takes the Auditor's report and executes the repairs. Line-by-line diffs, surgical edits, mechanical corrections. This agent doesn't need to understand the architecture — it just needs clear instructions and fast execution. I assigned it a model optimized for coding: fast, precise, and cheap to run in iterative loops.

**The Migrator** handles fresh translations — new files that haven't been converted yet. It takes the original legacy source, the project's style guide and architectural rules, and produces a first-pass migration. It's the starting point, not the finish line.

**Me.** I'm the orchestrator. I don't let my own context get polluted with the fine-grained details of each fix. Instead, I drive the pipeline — reviewing the Auditor's findings, steering the Fixer's priorities, deciding when a file needs another pass, and making the engineering judgment calls. I'm not a hardware test engineer by trade. I'm a software engineer with seventeen years of experience managing complex systems, and that's exactly the skill set the orchestrator role demands: knowing how to learn a domain fast, ask the right questions, and keep a team moving in the right direction.

## The Pipeline

Here's how a file moves through the system:

**Step 1 — Migrate.** The Migrator produces a first-pass C translation from the legacy source. This gets the structure, function signatures, and general flow in place. It's fast and about 60-70% accurate on a good day.

**Step 2 — Audit.** The Auditor reads the migrated file side-by-side with the original. It produces a structured findings report: here's what's wrong, here's where, here's what the original actually says. No fixes — just diagnosis. Think of it as a senior engineer doing a thorough code review.

**Step 3 — Fix.** The Fixer takes the audit report and applies every correction. It works fast, iterating through fixes and recompiling until the build is clean. This is where the volume happens — dozens of fixes per file, often in minutes.

**Step 4 — Verify.** I review the output. I check the Auditor's logic. I spot-check the migrated code against the source documentation — cross-referencing what was intended with what was produced. If something doesn't add up, I send it back for another audit cycle. You don't need to be a domain expert to catch a mismatch between "the original says 16 pins" and "the migration says 1 pin." You need to be methodical.

**Step 5 — Ship.** The file gets committed, the build gets tested, and we move to the next one.

If you've ever worked on a team where a tech lead reviews pull requests and sends them back with comments, and a developer pushes fixes until the PR is approved — that's exactly what this is. Except the review cycle that used to take days takes minutes.

## Why This Structure Works

The magic isn't in any individual agent. It's in the separation of concerns.

The Auditor never writes code, so its context stays clean. It can hold the full picture — the original source, the migrated output, the hardware documentation — without getting distracted by syntax details. When you ask a heavy reasoning model to *only think*, it thinks incredibly well.

The Fixer never makes architectural decisions, so it stays fast. It gets a clear list of changes and executes them. No ambiguity, no context drift, no wasted tokens on re-understanding the problem. When you ask a coding model to *only code*, it codes incredibly well.

And I never get buried in individual line edits, so I can keep the overall quality bar high and make the engineering decisions that matter — process design, quality gates, and knowing when something doesn't smell right even if I can't immediately explain why.

Each agent operates within a narrow cognitive scope, using a model matched to that scope. Heavy reasoning where reasoning matters. Fast execution where speed matters. Human judgment where experience matters.

## The Numbers That Changed

After building this pipeline, I processed 170+ fixes in a single day across multiple files. Some of those fixes were trivial — wrong variable names, missing type casts. But many were deep structural issues: measurement scoping errors where a value was being read from the wrong context, hardware card mappings that pointed to the wrong physical instrument, signal patterns that would've passed the wrong voltage to the wrong pin on a real test station.

How long would those have taken manually? It's genuinely hard to put a number on it. Some issues you'd spot immediately just by reading the code. Others would take hours of stepping through execution paths, reviewing runtime variables, and cross-referencing hardware documentation to even *understand* the problem before you could fix it.

What I can say is this: the pipeline turned weeks of manual review into a single day of supervised automation. Not because the AI is smarter than an engineer — it isn't. But because the pipeline lets each component do what it's best at, continuously, without getting tired or losing focus.

## The Hardest Bug Pattern

The subtlest issues weren't syntax errors or even logic errors in the traditional sense. They were **scoping errors** — places where the migrated code calculated a value correctly but stored it or referenced it from the wrong context.

In hardware test code, a measurement might be taken at one point and used pages later in a comparison. If the migration preserves the measurement logic but puts the result in the wrong scope, the test will *run* fine — it just won't test what it's supposed to test. The signal path looks right. The code compiles. But the physics is wrong.

These are the bugs that keep test engineers up at night, because they're invisible in a casual code review. You have to systematically compare the migration output against the original source, line by line, context by context. That's exactly why the Auditor earned its keep — it never gets tired of cross-referencing, and it catches mismatches that a human reviewer could easily miss on page 47 of a 60-page file.

But here's the honest truth: the agents couldn't always differentiate between a clean, simple solution and an over-engineered one. Sometimes the Fixer would produce a technically correct but unnecessarily complex implementation when a straightforward approach would've been better. A human has to review the *approach*, not just the output. You have to be willing to question the agent's reasoning, not just accept it because it compiles.

## What Surprised Me

The teamwork.

I know that sounds weird when you're talking about software models. But when you design agents to network together — when you give them clear roles, clean interfaces, and structured communication — they genuinely collaborate. The Auditor produces a finding, the Fixer addresses it, and the result is better than either could produce alone. It's emergent quality from structured specialization.

What's counterintuitive is how much it mirrors real engineering teams. Every career engineer wears multiple hats over the years — you're the junior developer, then the senior, then the code reviewer, then the architect, then the team lead. These different hats are exactly the roles you assign to agents. And collectively, they make up something that functions like a well-rounded engineering team — maybe not a single super-engineer, but a team of specialists that covers every angle.

The other thing that surprised me is how important it is to *not* let your orchestration layer get buried in details. My biggest mistake early on was trying to be both the driver and the mechanic. Once I stepped back to the orchestrator role — steering strategy, reviewing findings, making judgment calls — the whole system moved faster and produced better results.

## The Honest Version

Here's what I won't pretend: this isn't a solved problem. Multi-agent pipelines require real engineering to set up, real domain expertise to steer, and real judgment to evaluate. The agents don't know what they don't know. The Auditor can miss things. The Fixer can introduce new issues. The whole pipeline is only as good as the engineer driving it.

But if you're sitting on a legacy codebase that needs to move to a modern platform, and you're staring at thousands of lines of specialized code thinking "there's no way to do this in any reasonable timeframe" — there is. It just doesn't look like one person grinding through files. It looks like building a team, assigning roles, and letting each member do what they're built for.

You don't need to be a domain expert in the legacy system to orchestrate this. You need to be a good engineer — someone who knows how to design a process, validate outputs, learn fast, and ask the right questions. The agents bring the tireless execution. You bring the judgment.

Including you.

---

*I'm a software engineer with seventeen years in defense and aerospace, currently working on legacy system modernization for DoD programs. If you're dealing with similar challenges — aging codebases, specialized languages, modernization timelines that seem impossible — I'd like to hear about it.*

*→ [Let's talk](https://justinbundrick.dev/#contact)*
