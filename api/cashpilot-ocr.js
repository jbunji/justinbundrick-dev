// CashPilot OCR — Vercel Serverless Function
// POST /api/cashpilot-ocr
// Photo → Gemini Vision → Structured expense data

const EXTRACTION_PROMPT = `Analyze this image of financial data (receipt, budget spreadsheet, bank statement, handwritten budget list, Excel screenshot, Google Sheets screenshot, or any financial document). Extract ALL financial data you can find.

Return a JSON object with:
- "type": The document type — one of: "receipt", "budget_spreadsheet", "bank_statement", "budget_list", or "mixed"
- "items": Array of all financial items found (can contain different types in the same array)
- "summary": A brief one-line summary like "Found 5 bills, 2 income sources, and 8 budget categories"
- "receipt_summary": (only if document is a receipt) An object with:
  - "merchant": Store/vendor name
  - "date": Date in YYYY-MM-DD format
  - "subtotal": Dollar amount (number, optional)
  - "tax": Dollar amount (number, optional)
  - "total": Final total amount (number)
  - "category": Best guess category (optional)
  - "note": Short note or additional info (optional)

If the document is NOT a receipt, omit "receipt_summary".

For EACH item in "items", determine the TYPE and extract the appropriate fields:

TYPE: "expense" (one-time transaction)
- type: "expense"
- amount: Dollar amount as number (no $ sign)
- merchant: Store/vendor name
- category: Best guess from: Groceries, Dining, Gas, Household, Subscriptions, Utilities, Shopping, Entertainment, Health, Transportation, Insurance, Housing, Personal, Education, Gifts, Other
- date: ISO 8601 (YYYY-MM-DD). If missing, use current date (2026-04-03)
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

DETECTION RULES:
- If you see columns like "Bill", "Due Date", "Amount" → extract as bills
- If you see "Income", "Paycheck", "Salary" → extract as income
- If you see "Budget", "Monthly Limit", "Allocated" → extract as budgets
- If you see "Goal", "Savings Target" → extract as goals
- Receipts with line items → extract as expenses
- Bank statements → extract as expenses (use description as merchant)
- Spreadsheet with mixed data → extract ALL types you see

IMPORTANT:
- Extract EVERY line item — don't skip rows
- Skip totals/subtotals/grand totals
- Skip running balances
- Skip headers/labels (only extract actual data rows)
- If uncertain about type, default to "expense"
- Handle messy handwriting and partial data gracefully
- For budget spreadsheets, EVERY row should become an item

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
      model: "google/gemini-2.0-flash-001",
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

    // Call OpenRouter with Gemini Vision
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.justinbundrick.dev",
          "X-Title": "CashPilot OCR",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: EXTRACTION_PROMPT,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter OCR error:", openRouterResponse.status, errorText);
      return res.status(502).json({
        error: "AI vision service unavailable",
        detail: openRouterResponse.status,
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
    const summary = parsed.summary || `Found ${items.length} item${items.length === 1 ? "" : "s"}`;
    const receiptSummary = parsed.receipt_summary || null;

    return res.status(200).json({ type: documentType, items, summary, receipt_summary: receiptSummary });
  } catch (error) {
    console.error("CashPilot OCR error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
