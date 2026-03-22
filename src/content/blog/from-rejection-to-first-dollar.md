---
title: "From Apple Rejection to First Paying Customer in 21 Days"
description: "I built 5 iOS apps in 3 weeks using AI, got rejected by Apple twice, and earned my first dollar from a complete stranger. Here's the whole story."
pubDate: 2026-03-22
tags: ["indie-dev", "ios", "ai", "app-store", "side-project"]
---

# From Apple Rejection to First Paying Customer in 21 Days

Three weeks ago, I had zero apps on the App Store. No TikTok account. No marketing experience. And honestly, no idea if anyone would ever pay for something I built.

Today I have 4 live apps, 250+ downloads, and my first paying customer — a complete stranger who found my app, used it for a few days, hit the free tier limit, and decided it was worth $4.99/month.

That $3.91 in proceeds (thanks, Apple's 30% cut) is the most meaningful money I've ever made in software.

Here's how it happened.

## Week 1: Building

I'm a software engineer by day — 17 years building DoD systems, Oracle databases, legacy code migrations. The kind of work where "move fast and break things" gets people court-martialed.

But I'd been watching indie developers ship apps at incredible speed using AI coding tools. Claude Code, Cursor, Copilot — tools that let a single developer do what used to take a team.

So I decided to test a theory: **Could I build a portfolio of real, shippable iOS apps using AI as my co-pilot?**

I sat down with SwiftUI (which I'd never used in production), Claude Code, and a list of app ideas. Five apps. Two weeks.

- **HabitForge** — AI-powered habit tracker that generates personalized plans from any goal
- **PlantPal** — Plant identification and care scheduling
- **ChoreQuest** — Gamified chore tracker for families
- **Upkeepy** — Home maintenance reminders
- **SubSentry** — Subscription spending tracker

Each one: full UI, CoreData persistence, in-app purchases, App Store-ready. Not prototypes — real apps with real polish.

## Week 2: Rejection

Apple rejected HabitForge twice.

First rejection: Missing EULA link on the paywall (Guideline 3.1.2c). Fair enough — my mistake.

Second rejection: Apple Watch companion app wasn't syncing properly (Guideline 2.1a). The Watch extension was there, but data wasn't flowing between phone and watch reliably. Had to rebuild the sync layer with `applicationContext` and retry logic.

SubSentry got rejected for not revoking Apple Sign-In tokens on account deletion (Guideline 5.1.1v). Another one I hadn't thought about.

PlantPal and ChoreQuest got rejected for missing IAP metadata in App Store Connect — the in-app purchases existed in code but weren't submitted for review alongside the app.

**Every single app got rejected at least once.**

Each rejection felt like a punch. But each one taught me something specific about what Apple actually checks. By the third fix, I was submitting with a mental checklist that would've saved me a week if I'd known it upfront.

## Week 3: Launch & First Dollar

By mid-week 3, four apps were live:
- HabitForge (after 2 rejections + Watch sync rebuild)
- PlantPal (after IAP metadata fix)
- ChoreQuest (after IAP metadata fix)
- Upkeepy (after 2 rejections for IAP issues)

I'd never marketed anything in my life. Never made a TikTok. Never posted on Reddit promoting something I built.

Wednesday night I wrote my first Reddit post. It wasn't about the app — it was about the problem. "After failing to stick with habits for years, I realized the problem wasn't discipline — it was bad planning." No link. Just the story.

Thursday I made my first TikTok. It was bad. Too long, text getting cut off, static slides. I posted it anyway.

Friday I made my second TikTok for PlantPal. Used a cannabis plant as my demo plant. The engagement was... enthusiastic.

**Saturday morning: $3.91 in proceeds appeared in App Store Connect.**

Someone — somewhere in the world — had downloaded HabitForge, used the free tier, hit the 3-habit limit, and decided to pay for Premium.

I don't know who they are. I'll never meet them. But they validated something I wasn't sure was real: that a solo developer with AI tools can build something people will pay for.

## What I Learned

**AI doesn't replace skill — it multiplies it.** I have 17 years of software engineering experience. AI let me apply that experience to a platform (iOS/SwiftUI) I'd barely touched before. Without the engineering foundation, the AI output would've been garbage. Without the AI, I'd still be reading SwiftUI tutorials.

**Apple rejections aren't failures — they're a checklist.** Every rejection taught me something I now check automatically. EULA links, token revocation, IAP metadata, Watch sync verification. I'll never make those mistakes again.

**Marketing is just storytelling.** I spent years thinking marketing was some dark art. It's not. It's telling people what you built and why. The Reddit post that drove downloads wasn't clever — it was honest.

**Your first dollar changes everything.** Before that $3.91, this was a hobby. After it, it's a business. The math is simple: if one person pays, more will. Now it's just a matter of reaching them.

## What's Next

SubSentry is still in review. I have 7 more apps designed and ready to build. The TikTok videos are getting less terrible with each one.

But more importantly, I proved something to myself: **the barrier between "I have an idea" and "someone is paying for it" has never been lower.** AI tools, App Store distribution, free social media marketing — the infrastructure exists. You just have to build.

243 downloads. 1 paying customer. $3.91.

It's a start.

---

*I'm a software engineer in Georgia building iOS apps with AI tools. You can find my apps at [justinbundrick.dev/apps](https://justinbundrick.dev/apps) or follow the journey on [TikTok @BunjiStudios](https://tiktok.com/@bunjistudios).*
