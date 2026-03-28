// CashPilot OCR — Vercel Serverless Function
// POST /api/cashpilot-ocr
// Photo → Gemini Vision → Structured expense data

const EXTRACTION_PROMPT = `Analyze this image of financial data (spreadsheet, receipt, bank statement, or handwritten notes). Extract ALL expense/transaction entries you can find.

Return a JSON object with a "transactions" array. For each transaction, extract:
- date: ISO 8601 format (YYYY-MM-DD). If only month/day, assume current year (2026).
- amount: Dollar amount as a number (no $ sign)
- merchant: Store/vendor name (best guess from description)
- description: Raw text from the image for this entry
- category: Best guess category from this list: Groceries, Dining, Gas, Household, Subscriptions, Utilities, Shopping, Entertainment, Health, Transportation, Insurance, Housing, Personal, Education, Gifts, Other
- confidence: "high", "medium", or "low" (how sure you are about this entry)
- isIncome: boolean (true if this looks like income/deposit, false for expenses)

Rules:
- Skip totals/subtotals/tax lines unless they're the only amount
- Skip running balances
- If you can't determine a date, use today's date (2026-03-28)
- If you can't determine a merchant, use the description
- If you can't determine a category, use "Other" with confidence "low"
- Extract EVERY line item you can see, even if some fields are uncertain
- For receipts: extract individual items OR the total — not both (prefer individual items if legible)
- Positive amounts for expenses, mark income with isIncome: true
- Handle messy handwriting and partial data gracefully

Return ONLY valid JSON. No markdown, no explanation, no code fences. Just the JSON object:
{"transactions": [{"date": "2026-03-15", "amount": 67.43, "merchant": "Kroger", "description": "Groceries", "category": "Groceries", "confidence": "high", "isIncome": false}, ...]}`;

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

    // Normalize: ensure we have a transactions array
    let transactions;
    if (Array.isArray(parsed)) {
      transactions = parsed;
    } else if (parsed.transactions && Array.isArray(parsed.transactions)) {
      transactions = parsed.transactions;
    } else {
      transactions = [];
    }

    // Validate and clean each transaction
    transactions = transactions
      .filter((t) => t && typeof t.amount === "number" && t.amount > 0)
      .map((t) => ({
        date: t.date || new Date().toISOString().split("T")[0],
        amount: Math.round(t.amount * 100) / 100,
        merchant: t.merchant || t.description || "Unknown",
        description: t.description || t.merchant || "",
        category: t.category || "Other",
        confidence: ["high", "medium", "low"].includes(t.confidence) ? t.confidence : "low",
        isIncome: t.isIncome === true,
      }));

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error("CashPilot OCR error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
