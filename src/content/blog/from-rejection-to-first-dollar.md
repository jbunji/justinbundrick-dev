---
title: "From Apple Rejection to First Paying Customer: 33 Days, 5 Apps, 9 Rejections"
description: "I built 5 iOS apps in 3 weeks using AI, faced 9 Apple rejections across 4 apps, and earned my first dollar from a stranger. Here's the whole story — including the timelines I got wrong the first time."
pubDate: 2026-03-22
tags: ["indie-dev", "ios", "ai", "app-store", "side-project"]
---

# From Apple Rejection to First Paying Customer: 33 Days, 5 Apps, 9 Rejections

I launched HabitForge back in October 2025. It sat there for months — a few downloads, zero revenue, zero marketing. I'd built it and forgotten about it.

Three weeks ago, I decided to stop dabbling and start shipping. No TikTok account. No marketing experience. And honestly, no idea if anyone would ever pay for something I built.

Today I have 4 live apps on the App Store, 250+ downloads, and my first paying customer — a complete stranger who found my app, used it for a few days, hit the free tier limit, and decided it was worth $4.99/month.

That $3.91 in proceeds (thanks, Apple's 30% cut) is the most meaningful money I've ever made in software.

Here's how it happened — the real timeline, with the rejections I didn't talk about the first time.

## The Real Timeline

When I first wrote about this, I glossed over the details. I said "3 weeks." I said "got rejected by Apple twice." I was optimistic and vague.

Here's what actually happened:

- **October 2025:** HabitForge originally launched. Free + IAP. Got a few downloads. I did nothing with it.
- **Early March 2026:** Decided to build 4 MORE apps in a sprint: PlantPal, SubSentry, ChoreQuest, Upkeepy. That's the "3 weeks" I talked about.
- **March 10-16:** Built and submitted all 4 apps simultaneously.
- **March 13-16:** The rejection wave. All 4 apps rejected at least once. Some twice.

**Total rejection count across all 5 apps: 9.**

Let me break that down.

## The Rejection Gauntlet

### HabitForge (originally launched October 2025, resubmitted March 2026)

**Rejection 1 (March):** Guideline 3.1.2(c) — Missing EULA link on the paywall. I had Terms of Use inside the app settings, but not directly on the paywall screen itself. Apple wants users to see the EULA *before* they hit Subscribe. Fixed by adding a Terms link right below the purchase button.

**Rejection 2 (March):** Guideline 2.1(a) — Apple Watch sync wasn't working reliably. I'd built a Watch companion app, but data wasn't syncing between phone and watch. The Watch extension was pulling stale data. Had to rebuild the sync layer using `applicationContext` for immediate updates and WatchConnectivity retry logic for offline scenarios. This one hurt because I thought I'd tested it. I hadn't tested it *enough*.

### PlantPal

**Rejection 1 (March 13):** Guideline 3.1.2(c) — Same EULA issue as HabitForge. No Terms of Use or Privacy Policy links visible on the paywall. Added both, plus explicit subscription terms (price, billing cycle, auto-renewal language). Resubmitted same day.

### ChoreQuest

**Rejection 1 (March 13):** Guideline 2.1(b) — Apple said the app had features requiring in-app purchase but no IAP was attached for review. The IAP *existed* in my code. It existed in App Store Connect as a product. But I hadn't **attached it to the version** I submitted. The checkbox in ASC that says "include this IAP with this version" was unchecked. Rookie mistake. Fixed, resubmitted.

**Rejection 2 (still pending, March 16):** Guideline 2.3(7) — "Join Family" flow wasn't working. Reviewer tried to use a valid join code on a second device and got an error. Root cause: CloudKit `joinCode` field wasn't set as Queryable in production. The query worked in dev but silently failed for the reviewer. Had to add the CloudKit index, redeploy to production, and add a fallback scan in code so it would work even without the index. Waiting on approval for build 2.

### Upkeepy

**Rejection 1 (March 13):** Guideline 2.1(b) — Same issue as ChoreQuest. IAP product existed but wasn't attached to the submitted version. Fixed, resubmitted.

**Rejection 2 (March 16):** Guideline 2.1(b) again — Still not seeing the IAP. This time I confirmed: the IAP metadata *itself* was incomplete. It had a product ID and a price, but no review screenshot. Apple wants to see what users will see when they purchase. Uploaded a screenshot of the paywall, resubmitted.

### SubSentry

**Rejection 1 (date TBD, still in review):** Guideline 5.1.1(v) — Not revoking Apple Sign-In tokens on account deletion. When a user deletes their account, the app has to call Apple's token revocation endpoint to invalidate their Sign-In session. I didn't know this was a requirement until Apple told me. Fixed by adding the revocation call to the account deletion flow.

## The Pattern I Missed

Looking back, most of these rejections fall into two categories:

**1. IAP metadata issues** — Having the purchase code in your app isn't enough. Apple needs:
   - The IAP product created in App Store Connect
   - The product **attached to the specific version** you're submitting
   - Complete metadata: display name, description, price, and a **review screenshot**
   - Terms of Use and Privacy Policy links visible **on the paywall itself**

I got this wrong on 3 out of 5 apps. PlantPal, ChoreQuest, and Upkeepy all had the same class of issue.

**2. Features that seem to work but don't scale** — HabitForge's Watch sync worked in my testing because I was always online and patient. The reviewer wasn't. ChoreQuest's join flow worked in development with CloudKit indexes that didn't exist in production. These are the bugs that only surface when someone other than you uses the app.

## The Frustration

I'm not going to sugarcoat it — some of these rejections were **maddening**.

The HabitForge Watch sync issue cost me days. I couldn't reproduce the failure locally because my environment was too forgiving. I had to set up a scenario where the phone and watch were offline, then reconnect them, then manually trigger sync, then verify the data flowed. Over and over. The issue wasn't obvious. It was a race condition in how WatchConnectivity queues messages when the devices aren't connected.

I remember texting my AI assistant (Kai, who helped build all of this) at like 11 PM saying **"dude I cannot figure this out."** The Watch was showing stale data and I couldn't see why. Turned out I was using `updateApplicationContext` which is fire-and-forget, but I needed immediate delivery guarantees. The fix was switching to `sendMessage` for urgent updates and keeping `applicationContext` for background state.

ChoreQuest's CloudKit index issue was my own fault. I built and tested everything in the Development environment. CloudKit has separate schemas for Dev and Production. The `joinCode` field was queryable in Dev but not in Production. When I submitted, the reviewer hit Production. The query failed silently (no error, just zero results), so the join flow returned "invalid code" even though the code was valid. That one I should've caught.

## What I Learned

**Apple's review process is a QA gauntlet you didn't ask for, but desperately need.** Every rejection caught a real bug. The EULA links? I genuinely forgot them. The Watch sync? Broken in ways I hadn't tested. The CloudKit production schema? I had no idea that was a separate deploy step.

I hated the rejections in the moment, but every single one made the app better.

**AI doesn't replace skill — it multiplies it.** I have 17 years of software engineering experience. AI let me apply that to a platform (iOS/SwiftUI) I'd barely touched before. I wrote about this in my [legacy code migration post](/blog/migrating-30k-lines-legacy-military-test-code-with-ai) — the pattern is the same. AI agents don't eliminate the need for engineering judgment; they amplify it. Without the foundation, the AI output would've been unusable. Without the AI, I'd still be reading SwiftUI tutorials.

**The rejection checklist you build is your real asset.** After 9 rejections, I now have a pre-flight checklist I run before every submission:
   - [ ] IAP product created in ASC
   - [ ] IAP attached to this version (checkbox in version page)
   - [ ] IAP has complete metadata + review screenshot
   - [ ] Terms of Use + Privacy Policy links on paywall
   - [ ] Subscription terms explicitly stated (price, period, auto-renewal)
   - [ ] CloudKit indexes deployed to **Production** (not just Dev)
   - [ ] Token revocation implemented (if using Sign in with Apple)
   - [ ] Offline/async flows tested with actual network delays

I'll never make those mistakes again.

**Marketing is just storytelling.** I spent years thinking marketing was some dark art reserved for people who understand SEO and growth hacking. It's not. It's telling people what you built and why it matters. The Reddit post that drove downloads wasn't clever — it was honest. "I built this because I kept failing at habits and realized the problem wasn't willpower, it was bad planning."

**Your first dollar changes everything.** Before that $3.91, this was a side project. After it, it's a business. The logic is simple: if one stranger will pay, more will. Now it's just a matter of reaching them.

## What's Next

As of today:
- **HabitForge:** Live (after 2 rejections)
- **PlantPal:** Live (after 1 rejection)
- **ChoreQuest:** Live (after 2 rejections)
- **Upkeepy:** Live (after 2 rejections)
- **SubSentry:** Still in review

I have 7 more apps designed. I'm learning TikTok (badly). The first few videos were disasters — too long, text cut off, static slides. But each one is less terrible than the last.

And now I know: the barrier between "I have an idea" and "someone is paying for it" has never been lower. AI tools, App Store distribution, free social media platforms — the infrastructure exists. You just have to build, survive the rejections, and keep shipping.

**258 downloads across 4 apps. 1 paying customer. $3.91 in proceeds.**

It's a start.

---

*I'm a software engineer in Georgia building iOS apps with AI. You can find my apps at [justinbundrick.dev/apps](https://justinbundrick.dev/apps), follow the journey on [TikTok @BunjiStudios](https://tiktok.com/@bunjistudios), or read about the technical process in my other posts on [AI-assisted code migration](/blog/migrating-30k-lines-legacy-military-test-code-with-ai) and [building with multi-agent teams](/blog/building-ai-agent-team-for-legacy-code).*
