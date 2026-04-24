// CashPilot OCR — Vercel Serverless Function
// POST /api/cashpilot-ocr
// Photo → Gemini Vision → Structured expense data

const EXTRACTION_PROMPT = `Analyze this image of financial data (receipt, budget spreadsheet, bank statement, handwritten budget list, Excel screenshot, Google Sheets screenshot, or any financial document). Extract ALL financial data you can find.

Return a JSON object with:
- "type": The document type — one of: "receipt", "budget_spreadsheet", "bank_statement", "budget_list", or "mixed"
- "items": Array of all financial items found (can contain different types in the same array)
- "summary": A brief one-line summary like "Found 5 bills, 2 income sources, and 8 budget categories"
- "receipt_summary": REQUIRED if document is a receipt or invoice. An object with:
  - "merchant": Store/vendor name (from the business header, "Bill To" vendor, or "From" line — NOT the customer's name)
  - "date": Date in YYYY-MM-DD format
  - "subtotal": Dollar amount (number, optional)
  - "tax": Dollar amount (number, optional)
  - "total": Final total INCLUDING tax (number — REQUIRED for receipts/invoices)
  - "category": Best guess single category for the whole purchase
  - "note": Short description of what was purchased (e.g. "Groceries", "Design services: Social Media, Furniture, Interior Design, Architecture")

If the document is NOT a receipt/invoice, omit "receipt_summary".

For EACH item in "items", determine the TYPE and extract the appropriate fields:

TYPE: "expense" (one-time transaction)
- type: "expense"
- amount: Dollar amount as number (no $ sign)
- merchant: Store/vendor name
- category: Best guess from: Groceries, Dining, Gas, Household, Subscriptions, Utilities, Shopping, Entertainment, Health, Transportation, Insurance, Housing, Personal, Education, Gifts, Other
- date: ISO 8601 (YYYY-MM-DD). If missing, use today's date
- confidence: "high", "medium", or "low"

TYPE: "bill" (recurring payment)
- type: "bill"
- name: Bill name (e.g., "Rent", "Electric", "Car Insurance")
- amount: Monthly amount as number
- due_day: Day of month (1-31)
- frequency: "monthly", "weekly", "biweekly", "quarterly", or "annual"
- category: Best guess category

TYPE: "income" (recurring income source)
- type: "income"
- name: Income source name (e.g., "Paychecks", "Side Hustle", "Freelance")
- amount: Amount per period
- frequency: "weekly", "biweekly", "monthly", "annual"
- is_w2: true if this looks like W-2 employment, false for 1099/contractor

TYPE: "budget" (monthly budget allocation for a category)
- type: "budget"
- category: Category name
- amount: Monthly budget amount

TYPE: "goal" (savings goal)
- type: "goal"
- name: Goal name
- amount: Target amount

DETECTION RULES — read section headers on the spreadsheet carefully. A header categorizes every row under it:
- "Income" / "Paycheck" / "Salary" / "Base Pay" / "BAH" / "BAS" header → every row under it is TYPE: "income"
- "Bill" / "Bills" / "Due Date" / "Monthly Payments" header → every row is TYPE: "bill"
- "Budget" / "Monthly Limit" / "Allocated" / "Budgeted" header → every row is TYPE: "budget"
- "Expenses" / "Spending" header → every row is TYPE: "expense"
- "Goal" / "Goals" / "Savings Target" / "Investments" / "Investment" / "Retirement" / "TSP" / "401k" / "IRA" / "Brokerage" header → every row is TYPE: "goal" (investments ARE savings goals in this app — Acorns, Portfolio, Savings, TSP contributions all become goals)
- Receipts and invoices (single vendor, single date, has subtotal/tax/total) → type="receipt", return ONLY receipt_summary with the final total INCLUDING tax. DO NOT itemize line items. Put line item descriptions in receipt_summary.note.
- Bank statements (multiple merchants, multiple dates, transaction list) → each row is TYPE: "expense"

EXTRACTION RULES — DO NOT SKIP ROWS:
- Read every single data row under every section header. If there are 8 expense rows, return 8 expense items. If there are 3 investment rows, return 3 goal items.
- Amounts must match EXACTLY what's on the page. $256.65 stays $256.65. Do NOT round $256.65 to 257 or $300.50 to 300.
- Skip ONLY: totals/subtotals/grand-totals, running balances, column headers, blank rows.
- Rows with dashes/hyphens in the amount column (like "-") mean zero — skip them.
- If a row has multiple amount columns (e.g. "Before Tax", "After Tax"), use the "After Tax" / net amount for income.

IMPORTANT:
- For RECEIPTS/INVOICES: return type="receipt" and put the total (with tax) in receipt_summary.total. Leave items array empty.
- For BUDGET SPREADSHEETS: itemize every row — EVERY row under EVERY section header should become an item, with its type determined by the section header above it.
- For BANK STATEMENTS: itemize every transaction row.
- Do NOT drop items because you think they're "similar" or "duplicates" — if they appear on the page, return them.
- Handle messy handwriting and partial data gracefully.

Return ONLY valid JSON. No markdown, no explanation, no code fences.

Example response:
{"type": "budget_spreadsheet", "items": [{"type": "bill", "name": "Rent", "amount": 3000, "due_day": 1, "frequency": "monthly", "category": "Housing"}, {"type": "income", "name": "Paychecks", "amount": 975, "frequency": "weekly", "is_w2": true}, {"type": "budget", "category": "Groceries", "amount": 600}, {"type": "expense", "amount": 50, "merchant": "Target", "category": "Shopping", "date": "2026-04-03", "confidence": "high"}], "summary": "Found 1 bill, 1 income source, 1 budget, and 1 expense"}`;

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
      service: "cashpilot-ocr",
      model: "anthropic/claude-haiku-4.5",
      timestamp: new Date().toISOString(),
    });
  }

  // POST only
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
    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Base64 image data is required" });
    }

    // Call OpenRouter with Gemini Vision — retry on transient upstream errors.
    // 502/503/504 from OpenRouter are almost always upstream LLM hiccups
    // (Gemini timeout, rate limit, capacity), not image problems. Retrying
    // once or twice turns most of those into successes.
    const callOpenRouter = () =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.justinbundrick.dev",
          "X-Title": "CashPilot OCR",
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4.5",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: EXTRACTION_PROMPT },
                {
                  type: "image_url",
                  image_url: { url: `data:image/jpeg;base64,${image}` },
                },
              ],
            },
          ],
          max_tokens: 3000,
          temperature: 0,
        }),
      });

    let openRouterResponse;
    let lastStatus = 0;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        openRouterResponse = await callOpenRouter();
      } catch (networkErr) {
        console.error(`OCR network error (attempt ${attempt}):`, networkErr.message);
        lastStatus = 0;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
          continue;
        }
        return res.status(503).json({
          error: "AI service unreachable — try again in a moment",
          detail: "network",
          transient: true,
        });
      }
      if (openRouterResponse.ok) break;
      lastStatus = openRouterResponse.status;
      const isTransient = [429, 500, 502, 503, 504].includes(lastStatus);
      if (!isTransient || attempt === maxAttempts) break;
      // Exponential backoff with jitter: 400ms, 900ms
      const delay = 400 * attempt + Math.floor(Math.random() * 200);
      console.warn(`OCR upstream ${lastStatus} on attempt ${attempt}, retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter OCR error (final):", openRouterResponse.status, errorText);
      const isTransient = [429, 500, 502, 503, 504].includes(openRouterResponse.status);
      return res.status(openRouterResponse.status === 429 ? 429 : 502).json({
        error: isTransient
          ? "AI service is busy — try again in a few seconds"
          : "AI vision service error",
        detail: openRouterResponse.status,
        transient: isTransient,
      });
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: "No response from AI vision" });
    }

    // Parse the JSON response — strip any markdown fences if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse OCR response:", cleanContent);
      return res.status(502).json({
        error: "Could not parse expense data from image",
        raw: cleanContent,
      });
    }

    // Normalize: ensure we have items array
    let items;
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      items = parsed.items;
    } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
      // Legacy format — convert to new format
      items = parsed.transactions.map((t) => ({
        type: t.isIncome ? "income" : "expense",
        ...t,
      }));
    } else {
      items = [];
    }

    // Strip trailing parenthetical descriptions from category names so
    // imported budgets match existing defaults. "Utilities (electricity,
    // water, gas)" -> "Utilities". Applied only to budget/expense category
    // fields — bill names, income names, goal names, and merchants keep
    // their parens because those are often legitimate ("Comcast (Internet)",
    // "Acme Corp (W-2)").
    const stripCategoryParens = (name) => {
      if (typeof name !== "string") return name;
      const stripped = name.replace(/\s*\([^()]*\)\s*$/, "").trim();
      return stripped.length > 0 ? stripped : name;
    };

    // Validate and clean each item based on type
    items = items
      .filter((item) => item && item.type && item.amount && item.amount > 0)
      .map((item) => {
        const cleanAmount = Math.round(item.amount * 100) / 100;

        switch (item.type) {
          case "expense":
            return {
              type: "expense",
              date: item.date || new Date().toISOString().split("T")[0],
              amount: cleanAmount,
              merchant: item.merchant || item.description || "Unknown",
              description: item.description || item.merchant || "",
              category: stripCategoryParens(item.category) || "Other",
              confidence: ["high", "medium", "low"].includes(item.confidence) ? item.confidence : "low",
            };

          case "bill":
            return {
              type: "bill",
              name: item.name || "Bill",
              amount: cleanAmount,
              due_day: typeof item.due_day === "number" ? Math.max(1, Math.min(31, item.due_day)) : 1,
              frequency: ["monthly", "weekly", "biweekly", "quarterly", "annual"].includes(item.frequency)
                ? item.frequency
                : "monthly",
              category: item.category || "Bills",
            };

          case "income":
            return {
              type: "income",
              name: item.name || "Income",
              amount: cleanAmount,
              frequency: ["weekly", "biweekly", "monthly", "annual"].includes(item.frequency)
                ? item.frequency
                : "monthly",
              is_w2: item.is_w2 === true,
            };

          case "budget":
            return {
              type: "budget",
              category: stripCategoryParens(item.category) || "Other",
              amount: cleanAmount,
            };

          case "goal":
            return {
              type: "goal",
              name: item.name || "Goal",
              amount: cleanAmount,
            };

          default:
            // Unknown type — treat as expense
            return {
              type: "expense",
              date: new Date().toISOString().split("T")[0],
              amount: cleanAmount,
              merchant: item.merchant || item.name || "Unknown",
              description: item.description || "",
              category: "Other",
              confidence: "low",
            };
        }
      });

    const documentType = parsed.type || "receipt";
    let receiptSummary = parsed.receipt_summary || null;

    // Collapse receipts/invoices into a single expense so the user gets ONE
    // transaction per receipt (tax included), not one per line item.
    const isReceiptLike =
      documentType === "receipt" ||
      documentType === "invoice" ||
      (receiptSummary && typeof receiptSummary.total === "number" && receiptSummary.total > 0);

    if (isReceiptLike) {
      // If Gemini didn't return a usable summary, synthesize one from items.
      if (!receiptSummary || typeof receiptSummary.total !== "number" || receiptSummary.total <= 0) {
        const expenseItems = items.filter((i) => i.type === "expense");
        const syntheticTotal = expenseItems.reduce((sum, i) => sum + (i.amount || 0), 0);
        if (syntheticTotal > 0) {
          receiptSummary = {
            merchant: expenseItems[0]?.merchant || "Receipt",
            date: expenseItems[0]?.date || new Date().toISOString().split("T")[0],
            total: Math.round(syntheticTotal * 100) / 100,
            category: expenseItems[0]?.category || "Other",
            note: expenseItems.map((i) => i.merchant || i.description).filter(Boolean).slice(0, 6).join(", "),
          };
        }
      }

      if (receiptSummary && receiptSummary.total > 0) {
        const collapsedExpense = {
          type: "expense",
          date: receiptSummary.date || new Date().toISOString().split("T")[0],
          amount: Math.round(receiptSummary.total * 100) / 100,
          merchant: (receiptSummary.merchant && receiptSummary.merchant.trim()) || "Receipt",
          description: receiptSummary.note || "",
          category: stripCategoryParens(receiptSummary.category) || "Other",
          confidence: "high",
        };
        items = [collapsedExpense];
      }
    }

    const summary = parsed.summary || `Found ${items.length} item${items.length === 1 ? "" : "s"}`;

    return res.status(200).json({ type: documentType, items, summary, receipt_summary: receiptSummary });
  } catch (error) {
    console.error("CashPilot OCR error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
