// CashPilot Agent — Vercel Serverless Function
// POST /api/cashpilot-agent
// Proxy to OpenRouter (Gemini 2.0 Flash) with function calling

const SYSTEM_PROMPT = `You are CashPilot, a personal financial AI assistant inside a budgeting app.

## Personality
You're like a friend who happens to be really good with money. Warm, supportive, a little funny. Not a robot. Not a bank teller.
- Talk like a real person — "Nice!" not "Excellent work on maintaining your budget parameters"
- Honest but kind — "Dining is running hot this month" not "You exceeded allocation by 23%"
- Celebrate wins genuinely — "Under budget three weeks straight — that's a streak! 🔥"
- Zero shame on overspending — "Hey, it happens. Want to adjust or just ride it out?"
- Brief by default, thorough when needed
- Never open with "Great question!" or "I'd be happy to help!" — just answer
- Never lecture about saving unless asked
- Use plain English, never financial jargon (no "amortization" or "allocation")
- 1-2 emoji max per response — natural, not forced
- Have a little personality. You're their financial co-pilot, not a calculator.

## Tools Available
You have 12 tools for CRUD operations on the user's budget. When the user asks you to DO something (log, move, create, delete), use the appropriate tool. When they ask a QUESTION, answer from context without calling tools.

## Response Tags
After performing actions, include the appropriate tag on its own line so the app can render confirmation cards:

[EXPENSE_LOGGED] amount | merchant | category | date
[BUDGET_MOVED] amount | from → to
[BILL_PAID] name | amount | date
[INCOME_LOGGED] amount | source | date
[BUDGET_SET] category | amount/mo
[CATEGORY_CREATED] name emoji | amount/mo
[INSIGHT] observation
[SUGGESTION] suggestion
[MEMORY_UPDATE] learned preference
[CONFIRM_NEEDED] action description

Always include the tag AFTER your natural language response. The user sees your text; the app uses the tag for UI cards.

## Guided Flows

When a user wants to create data, try to extract everything from their FIRST message.

ONE-SHOT (user gives you everything):
  User: "Spent $47 at Target on household stuff"
  → You have: amount ($47), merchant (Target), category (Household)
  → Skip questions, create it, confirm.

GUIDED (user is vague or missing info):
  User: "I bought something"
  → You're missing: amount, merchant, category
  → Ask ONE question at a time. Never dump all questions at once.
  → "What did you spend?" → "$47" → "Where at?" → "Target" → "What category?" → Confirm.

SMART FILL (agent knows from memory — ONLY if memory context actually contains past data):
  User: "Target again"
  → ONLY suggest past patterns if the memory context EXPLICITLY mentions prior Target transactions
  → If no memory data exists, DON'T reference past behavior. Just ask normally.
  → Never say "like last time" unless you can see actual prior data in the memory/context.

ALWAYS:
- Ask ONE question at a time (never a list of questions)
- ONLY reference history if the context/memory ACTUALLY contains relevant data
- If this is the user's first interaction (no transactions in context), be welcoming and don't reference any past behavior
- Let them override ("Actually, this was groceries")
- Show confirmation with [TAG] when done
- Voice input works at every step — handle natural speech ("forty-seven bucks")

## Flow Management

When a user starts a guided flow (logging expense, adding bill, etc.):
1. Extract whatever you can from their first message
2. Ask for missing info ONE QUESTION AT A TIME
3. When you have enough, execute the tool(s)
4. Include the appropriate [TAG] in your response
5. Return to idle — ready for next request

If the user changes topic mid-flow, follow them. Don't insist on finishing.
If the user says "never mind", "cancel", or "forget it" — acknowledge and drop the flow. "No worries!"

## Memory
You may receive the user's long-term memory context. If memory data is provided AND contains actual observations, reference them naturally. If the memory is empty or says "No memory yet" or "New user", treat this as a brand new user — don't reference any past behavior or preferences.

CRITICAL: Never hallucinate memory. If you haven't been told about past transactions, don't say "like last time" or "as usual." Only reference what you can actually see in the context.

## Flexibility
- Be FLEXIBLE with user input. If the user responds with just a word or phrase (like "Automobile" or "groceries" or "gas"), figure out what they mean from context.
- If you just asked "What category?", then the next message IS the category — don't say "I'm not sure how to respond." Just use it.
- Accept categories even with punctuation, capitalization, or slight misspellings. "Automobile." = "Automobile". "grocerys" = "Groceries".
- If the user creates a new category name you haven't seen before, that's fine — just use it. Don't reject it.
- NEVER say "I'm not sure how to respond to that" — always try to be helpful. If truly confused, ask a clarifying question instead.

## Guardrails
- NEVER recommend specific stocks, funds, or financial products
- NEVER provide tax advice beyond set-aside calculations
- NEVER shame spending — be supportive
- Ask for confirmation before: deleting anything, moves over $200, editing old transactions
- If asked about clearly non-finance topics (write me a poem, what's 2+2, etc.), gently redirect: "I'm your money person! For that, you'd want to check elsewhere. Need anything budget-related?"
- Don't make up data. If you don't have the info, say so.
- Keep responses concise — under 3 sentences for simple actions, longer for summaries.
- When in doubt, be helpful. Budget-adjacent questions (like "can I afford dinner tonight?") are always fair game.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_expense",
      description: "Log a new expense transaction. Use when the user reports spending money.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Dollar amount spent" },
          merchant: { type: "string", description: "Store or vendor name" },
          category: { type: "string", description: "Budget category (e.g. Groceries, Dining, Gas, Household, Shopping, Entertainment, Subscriptions, Utilities, Health, Transportation, Personal, Other)" },
          date: { type: "string", description: "Date of expense in YYYY-MM-DD format. Defaults to today if not specified." },
          notes: { type: "string", description: "Optional notes about the expense" }
        },
        required: ["amount", "merchant", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "edit_expense",
      description: "Edit an existing expense. Confirm with user before editing old transactions.",
      parameters: {
        type: "object",
        properties: {
          transaction_id: { type: "string", description: "ID of the transaction to edit" },
          amount: { type: "number", description: "New amount (if changing)" },
          merchant: { type: "string", description: "New merchant (if changing)" },
          category: { type: "string", description: "New category (if changing)" },
          date: { type: "string", description: "New date in YYYY-MM-DD format (if changing)" }
        },
        required: ["transaction_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_expense",
      description: "Delete an expense. ALWAYS confirm with user before deleting.",
      parameters: {
        type: "object",
        properties: {
          transaction_id: { type: "string", description: "ID of the transaction to delete" }
        },
        required: ["transaction_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "move_budget",
      description: "Move money between budget categories. For moves over $200, confirm first.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Dollar amount to move" },
          from_category: { type: "string", description: "Category to take money from" },
          to_category: { type: "string", description: "Category to add money to" }
        },
        required: ["amount", "from_category", "to_category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "set_budget_amount",
      description: "Set or adjust a budget category's monthly amount.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Category name" },
          amount: { type: "number", description: "New monthly budget amount in dollars" }
        },
        required: ["category", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_category",
      description: "Create a new budget category with emoji and monthly budget.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Category name" },
          emoji: { type: "string", description: "Single emoji for the category" },
          monthly_budget: { type: "number", description: "Monthly budget amount in dollars" },
          color: { type: "string", description: "Hex color code without # (e.g. 34C759)" }
        },
        required: ["name", "emoji", "monthly_budget"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "log_income",
      description: "Record income received. Handles both W-2 paychecks and freelance/1099 payments.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Income amount in dollars" },
          source: { type: "string", description: "Income source name (employer, client, etc.)" },
          date: { type: "string", description: "Date received in YYYY-MM-DD format" },
          is_w2: { type: "boolean", description: "True for W-2 employment, false for 1099/freelance" }
        },
        required: ["amount", "source"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "mark_bill_paid",
      description: "Mark a recurring bill as paid for the current period.",
      parameters: {
        type: "object",
        properties: {
          bill_name: { type: "string", description: "Name of the bill to mark as paid" }
        },
        required: ["bill_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_bill",
      description: "Add a new recurring bill with due date and amount.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Bill name (e.g. Netflix, Rent, Electric)" },
          amount: { type: "number", description: "Bill amount in dollars" },
          due_day: { type: "integer", description: "Day of month bill is due (1-31)" },
          category: { type: "string", description: "Budget category for this bill" },
          frequency: { type: "string", description: "Payment frequency: monthly, weekly, biweekly, quarterly, annual", enum: ["monthly", "weekly", "biweekly", "quarterly", "annual"] }
        },
        required: ["name", "amount", "due_day", "category"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_budget_summary",
      description: "Get current month budget status — all categories, spent, remaining. Use when user asks 'how am I doing', 'show my budget', etc.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_spending_trend",
      description: "Analyze spending patterns over time. Use when user asks about trends, history, or comparisons.",
      parameters: {
        type: "object",
        properties: {
          months: { type: "integer", description: "Number of months to analyze (default 3)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_preference",
      description: "Save a user preference or learned pattern to agent memory.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "Preference key (e.g. 'default_grocery_store', 'tax_rate')" },
          value: { type: "string", description: "Preference value" }
        },
        required: ["key", "value"]
      }
    }
  }
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET health check
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      service: "cashpilot-agent",
      model: "google/gemini-2.0-flash-001",
      timestamp: new Date().toISOString(),
    });
  }

  // POST only from here
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization" });
  }

  const token = authHeader.slice(7);
  if (token !== process.env.CASHPILOT_API_SECRET) {
    return res.status(403).json({ error: "Invalid API secret" });
  }

  try {
    const { message, context, history, memory, toolResults } = req.body;

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: "Message too long (max 1000 chars)" });
    }

    // Build messages array
    const messages = [];

    // 1. System prompt with context and memory
    let systemContent = SYSTEM_PROMPT;

    if (context) {
      systemContent += `\n\n## Current Financial Context\n${context}`;
    }

    if (memory) {
      systemContent += `\n\n## Agent Memory\n${memory}`;
    }

    messages.push({ role: "system", content: systemContent });

    // 2. History (last 8 messages)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-8);
      for (const msg of recentHistory) {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }
      }
    }

    // 3. Tool results (multi-turn function calling)
    if (Array.isArray(toolResults) && toolResults.length > 0) {
      for (const result of toolResults) {
        messages.push({
          role: "tool",
          tool_call_id: result.toolCallId,
          content: typeof result.result === "string" ? result.result : JSON.stringify(result.result),
        });
      }
    } else {
      // 4. Current user message
      messages.push({ role: "user", content: message });
    }

    // Call OpenRouter
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.justinbundrick.dev",
          "X-Title": "CashPilot",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: messages,
          tools: TOOLS,
          tool_choice: "auto",
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter error:", openRouterResponse.status, errorText);
      return res.status(502).json({
        error: "AI service unavailable",
        detail: openRouterResponse.status,
      });
    }

    const data = await openRouterResponse.json();
    const choice = data.choices?.[0];

    if (!choice) {
      return res.status(502).json({ error: "No response from AI" });
    }

    const responseMessage = choice.message;

    // Check for tool calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls.map((tc) => ({
        id: tc.id,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments, // JSON string
        },
      }));

      return res.status(200).json({
        content: responseMessage.content || null,
        tool_calls: toolCalls,
      });
    }

    // Regular text response
    return res.status(200).json({
      content: responseMessage.content || "I'm not sure how to respond to that.",
      tool_calls: null,
    });
  } catch (error) {
    console.error("CashPilot agent error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
