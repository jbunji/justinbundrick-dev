---
title: "I Migrated 30,000 Lines of Legacy Military Test Code Using AI"
description: "How I used AI coding assistants to migrate 30,000 lines of ATLAS test code to C for military automated test equipment — and what I learned about process, humility, and the real way to work with AI."
pubDate: 2026-02-21
author: "Justin Bundrick"
---

Thirty thousand lines of code I'd never seen before, written in a language I didn't know existed, describing the physics of hardware I'd never touched.

That was the job.

And honestly? It was overwhelming.

## What Is ATLAS and Why Should You Care

If you've spent your career in mainstream software development, you've probably never heard of ATLAS. That's fine — I hadn't either, and I've been writing software in defense and aerospace for seventeen years.

ATLAS — Abbreviated Test Language for All Systems — is a domain-specific language designed for automated test equipment. It's been around for decades, quietly running the test programs that verify whether critical military hardware actually works. Radar subsystems, signal routing, digital I/O, analog measurements — ATLAS describes the physics of how test stations interact with the hardware they're validating.

It's not a general-purpose language. It doesn't look like C or Python or anything you'd recognize from a modern IDE. ATLAS speaks in terms of signal paths, measurement tolerances, and instrument configurations. It's essentially a hardware-native scripting language built by test engineers for test engineers.

And a lot of it is getting old.

The defense industry is sitting on mountains of legacy ATLAS code — test programs written decades ago that still work, still run, but live on aging platforms that are increasingly expensive to maintain. Modernization isn't optional anymore. It's a logistics reality.

## The Challenge

The project was straightforward on paper: take roughly 30,000 lines of ATLAS code for a radar interface test system and migrate it to a C code base. No changing requirements. No redesigning tests. Just move everything from the old paradigm to the new one, line by line, file by file.

Simple, right?

Here's the thing most people outside this world don't understand: you can't just translate ATLAS to C the way you'd port Python to JavaScript. It's not a syntax problem. It's a paradigm problem.

ATLAS has native constructs for things like signal routing, instrument control, and measurement sequences. C doesn't. When you move to a C-based framework, you need an entire hardware abstraction layer sitting between your test logic and the physical instruments. Every ATLAS statement that says "connect this signal to that pin and measure the response" has to be re-expressed through framework APIs, driver calls, and explicit resource management that ATLAS handled implicitly.

It's not translation. It's re-architecture.

And I was doing it for a system I'd never worked on, in a source language I'd never read, touching hardware I'd never seen. I had deep software experience, sure — but ATLAS is low-level code that describes the physics of the hardware. That was completely new territory for me.

## The First Attempt: Humbling

I did what any engineer would do when staring down a 30,000-line mountain: I reached for the best tools available. AI coding assistants had been making waves, and I figured this was a perfect use case. Take the ATLAS, feed it to an AI, get C code back. Maybe clean it up a little. Ship it.

I really wanted to be lazy about it. I'll admit that.

So I went file by file, asked the AI to convert each one, and started reviewing the output. And that's when reality hit.

The first drafts were riddled with problems. Mis-mapped function calls. Hallucinated API references. Duplicate code blocks. Incorrect parameter assignments. The AI was producing *something*, but it wasn't producing *correct* something — at least not at the fidelity this kind of work demands.

My first instinct was to blame the tool. I thought the AI just wasn't smart enough. It couldn't handle the domain complexity, couldn't understand what ATLAS was actually doing, couldn't make the conceptual leap from one paradigm to another.

But I kept digging. And I realized the problem wasn't the AI's intelligence.

The problem was my process.

## The Breakthrough: Process Over Power

Here's what I learned, and it's the thing that changed everything: AI coding assistants are not magic boxes you throw problems into and catch solutions from. They are *tools* — powerful, impressive tools — but tools that perform best when you understand their constraints and work within them.

The biggest constraint? Context. These models have a finite window of attention, and when you exhaust it by dumping an entire file's worth of complex domain-specific code, you get degraded output. The AI starts losing track of earlier mappings, generating inconsistencies, and filling gaps with plausible-sounding nonsense.

Once I understood that, I fundamentally changed my approach. Instead of asking the AI to convert entire files, I broke the work into focused, specific tasks — small enough that the model could hold the full context in its head and produce accurate output. I reviewed every section. I validated every mapping. I worked *with* the AI instead of delegating *to* it.

Some people don't want to hear that. They want AI to be a magic wand that eliminates the need for engineering judgment. But that's not how it works — not yet, and especially not in a domain where a wrong pin assignment or a swapped test pattern can mean the difference between a system that passes validation and one that masks a real hardware defect.

After my first pass, a senior engineer reviewed the output. He found real bugs. Wrong card mappings. Incorrect pin assignments. Swapped test patterns. It was humbling. It was also exactly the kind of review that *had* to happen.

That experience proved something I now consider non-negotiable: **AI output in safety-critical domains must be audited by domain experts.** Full stop. The AI can get you 80% of the way there in a fraction of the time, but that last 20% — the part where correctness actually matters — requires human eyes that understand what the code is supposed to *do*, not just what it's supposed to *look like*.

## Building the Cookbook

After that humbling first pass, something interesting happened. We got smarter — not just about the code, but about how to *use* the AI.

I like to think of it this way: giving an AI agent a skill is like giving it a cookbook instead of making it figure out how to cook from scratch every time.

We started building reusable assets. Validation tools that could catch common mapping errors. Documented patterns for recurring code structures. Reference guides that encoded the domain knowledge the AI needed to produce accurate output. Every mistake we found became a lesson we codified. Every pattern we validated became a template we could reuse.

The result was dramatic. Each subsequent migration module was faster, more accurate, and required less manual correction than the one before. We were building institutional knowledge *into* the process — not just relying on the AI to figure it out cold each time.

We weren't just using AI. We were learning how to work with it. And there's a world of difference between those two things.

## The Results

Here's where I'll let the numbers speak.

That first migration — the one where I was learning everything the hard way — consumed approximately **520 million tokens** across roughly **7,500 AI interactions**. It was messy. It was iterative. It was expensive in terms of compute.

A subsequent migration of comparable complexity — thirteen modules, similar code patterns — took approximately **1 million tokens**. 

That's a **520x efficiency improvement**.

Same AI. Same engineer. Radically different process.

Without AI, this kind of migration would traditionally require a team of experienced test engineers spending months just on the initial code review and mapping — before a single line of C gets written. With the iterative AI-assisted approach we developed, we went from zero to approximately 90% complete in weeks.

Not months. Weeks.

And every migration after the first gets faster, because the process and institutional knowledge compound.

## Lessons Learned

After seventeen years in defense software and one very intense AI-assisted migration, here's what I'd tell anyone considering this approach:

**1. AI is a force multiplier, not a replacement.**
It won't replace your domain experts. It will make them dramatically more productive. The engineer who understands what the code is *supposed to do* is still the most important person in the room. AI just means they can cover ten times the ground.

**2. Process matters more than model power.**
The same AI that produced garbage output on day one produced excellent output on day thirty — not because the model improved, but because my process did. How you structure tasks, manage context, and validate output matters more than which model you're using.

**3. The first one is the hardest.**
Your first AI-assisted migration will be painful, expensive, and full of mistakes. That's not failure — that's learning. Every error you catch becomes a pattern you prevent. Every workaround becomes a skill. The ROI isn't in the first project; it's in every project after.

**4. Domain expertise is non-negotiable.**
AI can generate plausible-looking test code all day long. Only a domain expert can tell you whether it's *correct*. In defense systems, "plausible but wrong" can have real consequences. Never skip the human review.

**5. Build the cookbook.**
Don't make the AI start from scratch every time. Document your patterns. Build your validation tools. Encode your domain knowledge into reusable assets. The investment pays for itself immediately.

## What's Next

The defense industry is facing a modernization wave that isn't slowing down. Legacy test systems, aging code bases, diminishing vendor support — these problems are only growing. The teams that figure out how to combine deep domain expertise with AI-assisted development are going to move at a pace that traditional approaches simply can't match.

I've seen it firsthand. I've lived the messy first attempt, the humbling code review, and the breakthrough that turned a six-month project into a six-week sprint. And I'm still learning — still refining the process, still finding ways to make each migration faster and more accurate than the last.

If your organization is sitting on legacy ATLAS code — or any legacy test code, really — and wondering how to modernize without losing years and millions of dollars, this is a conversation worth having.

The tools exist. The process works. You just need someone who's already made all the mistakes.

I've made plenty. [Let's talk.](https://justinbundrick.dev/contact)
