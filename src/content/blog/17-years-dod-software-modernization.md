---
title: "What 17 Years on a DoD Program Taught Me About Software Modernization"
description: "Legacy defense systems survive for decades — not because they're good, but because replacing them is terrifying. Here's what I've learned about why modernization stalls, who pushes back, and how to actually get it done."
pubDate: 2026-02-22
author: "Justin Bundrick"
---

I've been working on the same Department of Defense program since 2009. Seventeen years. Same mission, same user base, same Oracle databases — different buildings, different contracts, different excuses for why we haven't modernized yet.

In that time, I've watched ColdFusion age out, Oracle Forms go from "enterprise standard" to "legacy liability," and entire tech stacks survive long past their expiration date — not because they were good, but because replacing them was scarier than maintaining them.

Here's what 17 years taught me about why defense software modernization is so hard, and what actually works when you finally get the green light.

## The Tech Stack Then vs. Now

The government isn't known for cutting-edge technology. That was true in 2009 and it's true today. They're trying to get better, but they're always years behind the private sector.

When I started, the IT infrastructure was largely unchanged from the early 2000s. If you wanted virtualization, you built it from bare metal. The concept of "cloud" in a military environment was theoretical at best. ColdFusion was powering web apps. Oracle E-Business Suite was the backbone. Everything ran in tightly controlled data centers behind layers of security policies that could choke an environment to death.

Over the years, the buzzwords showed up — sprints, Lean, Kanban boards, Jenkins pipelines. The intent was right. But every pipeline hit the same wall: the production border. Security policies, Risk Management Framework (RMF) compliance, authority-to-operate gates. You could be agile in development and completely frozen at deployment.

Only recently has cloud started replacing those aging data centers. AWS GovCloud and Azure Government showed up with hardened, accredited environments. And with them came the promise of pay-as-you-go infrastructure — storage, compute, memory, networking — all configurable without a six-month procurement cycle.

But here's the thing most people outside defense don't realize: the applications themselves barely changed. The government doesn't invest in modernization. They invest in maintenance — fixing defects, applying security patches, keeping the lights on. The tech stack in the applications I support has stayed largely the same for nearly two decades.

## Why Legacy Systems Survive So Long

ColdFusion. Oracle EBS. ATLAS. These weren't cutting-edge when I started working with them. They were already niche, already aging, already accumulating technical debt.

So why do they survive?

Two reasons: **scarcity of expertise** and **accidental job security**.

The talent pool for these technologies was always small. Finding someone who could work in ColdFusion or navigate Oracle Forms at a deep level was hard. And the people who could? They became indispensable. Their knowledge of the legacy system was the moat — the thing that kept them employed and kept anyone from suggesting a rewrite.

I've been part of that dynamic. I understand it. When you're one of a handful of people who truly understands a system, there's a natural (if subconscious) incentive to keep it complex, to keep it legacy, to keep it *yours*.

The pattern repeats across every defense program I've seen: specialized knowledge creates dependency, dependency creates inertia, and inertia keeps 20-year-old systems alive.

## The Hardest Part Civilians Don't Understand

If you've only built software in the private sector, you might think the hard part of government modernization is the technology. It's not. The technology is the easy part.

The hard part is the **red tape**.

The Risk Management Framework alone can stall a project for months. Every system needs an Authority to Operate (ATO). Every change needs documentation, review, and approval. Cybersecurity requirements compound at every level — and they should, these are national security systems — but the overhead is crushing for small teams trying to move fast.

And then there's the expertise gap. It was impossible to "fake it till you make it" when it came to getting cloud infrastructure approved and operational. The decision-makers up the chain often lacked the technical depth to make the right calls at the right time. You'd have people approving (or blocking) architectures they didn't fully understand, based on risk models that hadn't been updated in a decade.

The result? Everything moves slower than it should. Not because the engineers are slow, but because the system around them was designed for a world where software shipped on physical media and "deployment" meant burning a CD.

## Who Pushes Back (and Why)

When you pitch modernization in a defense environment, the resistance rarely comes from people who dislike new technology. It comes from rational actors protecting their interests:

**Frontline workers and mid-level managers** push back from change fatigue. They're already overburdened. The idea of learning a new system while maintaining the old one — with no reduction in workload — is genuinely threatening to their daily operations.

**Legacy IT staff** resist because modernizing threatens to make their specialized skill sets obsolete. If you're the only person who understands the ColdFusion codebase, a migration to React isn't an upgrade — it's a pink slip. Their gatekeeper status is their job security, and they know it.

**Leadership and security teams** push back from fear. Not fear of technology — fear of failure. To a program director or authorizing official, an outdated but known system feels safer than the unknown attack surfaces of a modern cloud environment. The calculus is simple: nobody gets fired for maintaining the status quo, but a botched migration that takes a system offline? That's career-ending.

To win these stakeholders, you can't sell the technology. You have to **reframe the risk**. The status quo isn't safe — it's a ticking clock. Legacy staff are retiring. Security vulnerabilities are accumulating. The cost of maintaining the old system is growing every year. You have to prove that *not* modernizing is now the riskier choice.

## The Most Expensive Mistake

The most consistent and costly mistake in government modernization is the **"lift-and-shift" trap**.

In a traditional migration, this looks like moving a poorly architected, heavily customized legacy system directly into a cloud environment without refactoring it. You take the spaghetti and host it on AWS. Congratulations — you now have cloud-hosted spaghetti.

With AI-assisted migrations, the trap evolves. Teams use large language models to translate legacy code line-by-line into a modern language. The AI faithfully preserves every quirk, every obsolete workaround, every piece of accumulated technical debt. It's a perfect translation of a broken system.

In both scenarios, the error is the same: **treating migration as a technical translation instead of a business transformation**.

A broken process doesn't become efficient just because it runs in GovCloud or was rewritten by an AI agent. If you don't untangle the actual business requirements from the legacy code first — if you don't map the workflows, cleanse the data, and question every assumption — you'll spend millions of taxpayer dollars building a modern, scalable version of the exact same problem.

I learned this firsthand. The AI tools I use are incredibly powerful, but they're translators, not architects. They need a human who understands the domain to tell them *what* to build, not just *how* to convert what already exists.

## The Window We Missed

There's a story I haven't told publicly, and it still bothers me.

We had a tech refresh — the kind that comes around once a decade in a defense program. New hardware across the board. The old servers were aging out, and we finally had the funding and the mandate to replace them.

This was our window. New hardware meant we could rethink the software stack too. We could have rebuilt on modern frameworks, redesigned the architecture, shed years of technical debt. The opportunity was right there.

But the direction was clear: maintain a life raft. Rebuild the legacy software on top of the new hardware. Keep everything functionally identical so we could reverse-engineer our way back to the safety net — the old system — if anything went wrong.

So that's what we did. We took all-new hardware and rebuilt it with the same software, updated just enough to stay within currently supported release dates. Nothing more.

Was it safe? Yes. Did we execute it well? Absolutely. Did we do it right by every measure the program office cared about? Without question.

But we missed our chance to be great.

That's not a failure of the engineers. It's not even a failure of leadership. It's the nature of working in government — where the downside of a failed modernization is career-ending, and the downside of staying legacy is just... more of the same. The incentive structure rewards safety. And safety, in a government context, almost always means doing what you've already done.

I think about that tech refresh a lot. Not with anger — I understand why the call was made. But with the clarity that comes from watching the same pattern repeat for 17 years. The window opens. The window closes. And the legacy system lives on.

## Advice for Junior Engineers

If you're a junior engineer walking into your first legacy defense codebase, here's what I'd tell you:

**Apply Chesterton's Fence.** Never remove or alter a piece of logic until you understand exactly why it was put there. In a defense environment, you're not just looking at poor architecture — you're looking at decades of statutory mandates, emergency wartime patches, and rigid hardware constraints from the 1990s.

**Respect the code before you rewrite it.** That "spaghetti" in front of you has been successfully executing critical national security missions for longer than you've been alive. The original developers weren't stupid — they were constrained by tools, timelines, and requirements you've never faced.

**Understand the blast radius.** Legacy defense systems rarely have comprehensive automated testing. A seemingly harmless refactor can take a downstream system offline. Trace the dependencies. Map the interfaces. Know what breaks if you change something.

**Write tests before you write code.** Capture the existing behavior first. If you don't have a test that proves the system works as-is, you have no way to prove your changes didn't break it.

**Ask "why" before you ask "how."** Aggressively ask senior engineers why a system behaves a certain way. The answer is almost never "because someone was lazy." It's usually "because of a regulation from 2004" or "because the hardware literally can't handle it any other way."

Humility first. Modernization second.

---

*I'm a software engineer with 17 years on DoD logistics and maintenance programs. I write about legacy modernization, AI-assisted development, and what it's actually like building software for defense. More at [justinbundrick.dev](https://justinbundrick.dev).*
