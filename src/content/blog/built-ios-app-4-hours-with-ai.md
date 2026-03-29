---
title: "I Built a Production iOS App in 4 Hours With AI — And It's Not a Todo List"
description: "An agent-powered budgeting app with function calling, voice input, receipt OCR, persistent memory, and a serverless backend — built from zero to running on my phone in a single Saturday morning."
pubDate: 2026-03-29
tags: ["indie-dev", "ios", "ai", "app-development", "side-project"]
---

# I Built a Production iOS App in 4 Hours With AI — And It's Not a Todo List

When people hear "built an app in 4 hours with AI," they picture a glorified CRUD form with a nice font. Three screens, a list view, maybe a settings page. Impressive on Twitter, useless in reality.

That's not what happened here.

On Saturday morning I sat down with an idea, an AI coding agent, and zero lines of code. By early afternoon, I had a budgeting app running on my iPhone 16 Pro Max with:

- An AI agent that understands natural language and executes real actions on your data
- 12 function-calling tools the agent can invoke mid-conversation
- Voice input (tap and talk, Speech framework)
- Photo receipt scanning with OCR (snap a receipt, it parses the line items)
- A serverless API backend deployed on Vercel
- 8 SwiftData models with relationship graphs
- Persistent agent memory that learns your spending patterns
- A gamification system with 15 unlockable achievements
- Subscription management with StoreKit 2
- An onboarding flow, a paywall, and a full design system

50+ Swift files. ~9,000 lines of code. 10 git commits. Two Vercel API routes live in production.

This is not a toy. Let me explain why.

## The Problem I Was Solving

Every budget app on the market makes you do the work. YNAB costs $109/year and expects you to manually categorize every transaction into envelopes. Monarch Money costs $100/year and drowns you in dashboards. Even the "simple" ones require 6-10 taps to log a single expense.

I wanted an app where you just *talk*.

"Spent 47 at Target, groceries."

That's it. The AI agent logs the transaction, categorizes it, updates your budget, and tells you what's left to spend today. One sentence instead of ten taps. If you forget to log for a week, the agent catches you up when you come back. If your income is irregular (freelancers, gig workers), it adapts instead of breaking.

Nobody occupies this exact intersection: **ADHD-friendly + freelancer-ready + agent-powered + affordable**. The closest competitors either have no AI at all, or charge $100+/year for basic automation.

## What "Agent-Powered" Actually Means

This is the part most people gloss over, so let me be specific.

CashPilot's AI isn't a chatbot that answers questions about money. It's an **agent with tools**. When you tell it something, it doesn't just generate a text response — it decides which actions to take, executes them against your local database, and confirms what it did.

The agent has 12 tools it can call:

- Log an expense (with automatic categorization)
- Create or modify a budget category
- Add income sources
- Set up recurring bills
- Create savings goals and track progress
- Query your spending history with filters
- Calculate your free-to-spend number
- Generate spending summaries by category, time range, or custom criteria

Each tool maps to real SwiftData operations. When the agent calls `log_expense`, a `Transaction` record gets created with proper relationships to `Category`, with the correct `isRecurring` flag, merchant name extraction, and amount parsing. When it calls `spending_summary`, it runs actual aggregate queries across your transaction history.

The key architectural decision: **tools execute client-side**. The AI model runs on Vercel (Gemini 2.0 Flash via OpenRouter), but all data stays on the device. The server decides *what* to do; the app does it locally. Your financial data never leaves your phone.

This matters because it means the agent can operate on complex local state — relationship graphs between transactions, categories, bills, and goals — without shipping your bank data to a server.

## The Agent Isn't Just Reactive

Most "AI features" in apps are reactive. You ask, it answers. CashPilot's agent is proactive.

It has a **MemoryManager** that persists context between conversations. It remembers that you told it your rent is $1,400 on the first of each month. It remembers you're saving for a trip. It remembers you overspent on dining last week and you said you'd cut back.

When you open the app on Monday morning, it doesn't say "How can I help?" It says "You're $127 ahead of your March budget. That dining goal you set? On track this week. Also, your electric bill is due Thursday."

That's not a text generation trick — it's a **ContextBuilder** that assembles your financial state, recent transactions, upcoming bills, goal progress, and historical patterns into a prompt that gives the agent enough information to be genuinely useful. The system prompt alone is substantial. It has to be, because the agent needs to understand your entire financial picture to give advice that isn't generic.

## The Response Pipeline

When the agent responds, it doesn't just return plain text. It uses a semantic tag system — structured markers in the response that the app's **ResponseParser** interprets into UI actions.

The agent might respond with something that looks like plain English to the user ("Logged $47.00 at Target under Groceries. You've got $312 left to spend today.") but under the hood, it's also emitting tags that trigger:

- A transaction confirmation card in the chat UI
- An update to the dashboard's free-to-spend number
- A budget category progress bar animation
- A potential achievement unlock ("First expense logged!")

The chat interface looks like iMessage. But it's doing significantly more work than a text thread.

## Voice and Vision

Two features that people assume are simple but absolutely are not:

**Voice input** uses Apple's Speech framework. Tap the microphone, speak, release. The transcribed text goes straight to the agent. But getting this right meant handling:
- Audio session conflicts (what happens when you double-tap?)
- The microphone permission flow without breaking the UX
- Ensuring the speech recognizer tears down cleanly so it doesn't block future sessions
- Making it feel instant, not laggy

**Receipt scanning** uses Gemini's vision capabilities. Take a photo of a receipt or a spreadsheet, and the app sends it to a dedicated OCR endpoint that extracts merchant, items, amounts, tax, and tip — then hands the structured data to the agent for logging. This handles restaurant receipts, grocery store printouts, even handwritten totals (mostly).

Neither of these features is a checkbox. They're each a full pipeline with error handling, edge cases, and UX polish.

## The Economics

I ran the numbers before writing a single line of code. This app has to make financial sense or it's a hobby.

**AI cost per message:** ~$0.0002 (Gemini 2.0 Flash)

That means 10,000 free-tier users sending 5 messages a day costs me about $91/month. At a 3% conversion rate to Pro ($4.99/month), that's 300 paying users generating $1,497/month. The margin on paid users is 99.6%.

I set a hard spending cap on OpenRouter at $100/month. Even in the worst case — explosive growth with terrible conversion — I can't lose more than a hundred bucks. The risk profile is completely asymmetric: capped downside, uncapped upside.

Compare that to YNAB's infrastructure costs with Plaid bank integrations, dedicated servers, and a massive engineering team. I'm running on Vercel's free tier with a Gemini API key.

## The 4-Hour Timeline

Here's roughly how the build went:

**Hour 1 — Foundation.** Data models (8 SwiftData schemas), DataManager singleton, ProManager for subscription state, Theme system, tab-based navigation scaffold. This is the skeleton.

**Hour 2 — The Agent.** AgentService with tool definitions, ContextBuilder, MemoryManager, ResponseParser, the Vercel serverless route with the full system prompt, and the chat UI (message bubbles, typing indicators, tool confirmation cards). This is the brain.

**Hour 3 — The Screens.** Dashboard with the free-to-spend hero number, donut chart, budget progress bars. Budget detail views. Transaction list with search and filters. Settings. Bills. Income sources. Savings goals.

**Hour 4 — Polish and Premium.** Achievement system (15 badges with unlock conditions), onboarding carousel, paywall with Apple's required subscription terms, voice input, photo receipt scanning, review prompts, and notification scheduling.

Each hour built on the previous one. The data models had to exist before the agent could operate on them. The agent had to work before the dashboard could render meaningful data. The dashboard had to be useful before the paywall made sense.

## Why This Isn't "Vibe Coding"

There's a perception that AI-assisted development means typing "make me a budget app" and waiting. That's not how this works.

I've been writing software for 17 years. I've built enterprise systems that process millions of records. I've migrated 30,000-line legacy codebases in languages most people have never heard of. That experience doesn't disappear when I pick up an AI tool — it *compounds*.

Every architectural decision in CashPilot came from engineering judgment:

- **Why SwiftData over Core Data?** Because Apple's direction is clear, the API is cleaner, and CloudKit integration is built-in. I'm not fighting the framework.
- **Why a serverless proxy instead of direct API calls?** Because API keys in client apps get extracted. It's happened to me before. The proxy adds 50ms of latency and eliminates the entire class of key-theft attacks.
- **Why function calling instead of just parsing text?** Because regex-based intent parsing is fragile and doesn't scale. Function calling gives you typed schemas, validation, and a clean contract between the AI and your code.
- **Why client-side tool execution?** Because server-side means shipping financial data off-device, which means compliance headaches, data breach liability, and user trust problems.

None of those decisions came from AI. They came from building software for almost two decades. The AI just typed faster.

## What's Actually Hard

Building software fast isn't impressive. Building software fast *that doesn't suck* is.

The hard parts of CashPilot aren't the screens or the models. They're:

1. **Agent reliability.** The AI has to never hallucinate a transaction. If a user says "spent 50 on groceries" and the agent logs $500, that's a critical failure. The system prompt is carefully constrained. The tool schemas enforce types. The app validates before writing.

2. **Memory coherence.** The agent needs to remember context across sessions without confusing users. If you mentioned your rent once three weeks ago, it should still know — but it shouldn't assume your rent amount hasn't changed. Memory management is a genuinely hard problem.

3. **The "Welcome Back" problem.** Budget apps have terrible retention because people feel guilty when they fall behind. CashPilot's agent is specifically designed to be non-judgmental about gaps. No "You haven't logged in 12 days!" guilt trips. Instead: "Hey, welcome back. I see some transactions since we last talked — want me to catch you up?"

4. **Useful free tier.** Most budget apps make the free tier deliberately crippled to force upgrades. That breeds resentment. CashPilot's free tier gives you the daily free-to-spend number, 3 budget categories, and 5 AI messages a day. That's genuinely useful for someone with simple finances. The upgrade sells itself when you *want* more, not when you're forced into it.

These are product problems, not code problems. AI can write the code. It can't make the product decisions.

## The Stack

For anyone curious:

- **Language:** Swift / SwiftUI
- **Data:** SwiftData with CloudKit sync
- **Build:** XcodeGen (project.yml → Xcode project)
- **Backend:** Vercel serverless (Node.js)
- **AI Model:** Gemini 2.0 Flash via OpenRouter
- **Payments:** StoreKit 2 (subscription + lifetime)
- **Voice:** Apple Speech framework
- **OCR:** Gemini Vision API (via dedicated Vercel route)

Total infrastructure cost to run: ~$0/month at current scale (Vercel free tier, pay-per-use AI).

## What's Next

CashPilot needs a few more days of polish before App Store submission. The core is solid — agent works, tools execute correctly, data persists, voice and OCR function. But there's a level of fit-and-finish that separates "works on my phone" from "worth $4.99/month to a stranger."

I'm testing it on my own finances this week. Dogfooding is the only QA that matters for a budgeting app. If it can handle my irregular freelance income, it can handle anyone's.

I'll post the App Store link when it's live.

---

## The Bigger Point

Four hours. One AI agent. A serverless backend. A production-quality iOS app with real intelligence built in.

The gap between "idea" and "shipped" has collapsed. Not because the apps got simpler — CashPilot is genuinely complex software. But because the *implementation time* compressed while the *thinking time* stayed the same.

I still spent a full evening the night before researching 13 competitors, analyzing pricing strategies, mapping Reddit complaints, and identifying the exact gap in the market. That research took longer than the build.

The hard work didn't go away. It just shifted. Less time wrestling with syntax and boilerplate. More time on architecture, product design, and the decisions that actually determine whether anyone will use the thing.

AI didn't make building apps easy. It made building apps *fast*. Those are very different things.

---

*I'm a software engineer in Georgia building iOS apps with AI. Check out CashPilot and my other apps at [justinbundrick.dev/apps](https://justinbundrick.dev/apps), follow the build on [TikTok @BunjiStudios](https://tiktok.com/@bunjistudios), or read the full journey from [legacy code migration](/blog/migrating-30k-lines-legacy-military-test-code-with-ai) to [Apple rejections](/blog/from-rejection-to-first-dollar).*
