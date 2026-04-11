import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseSnapshot {
  id: string;
  code: string;
  name: string;
  credits: number;
  currentGrade: number; // percentage
  assignments: Array<{
    name: string;
    type: string;
    weight: number;
    score: number | null;
    dueDate?: string;
  }>;
}

interface RequestBody {
  courses: CourseSnapshot[];
  gpa: number;
  targetGpa?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Build a concise academic context string to feed Claude */
function buildContext(courses: CourseSnapshot[], gpa: number, targetGpa?: number): string {
  const lines: string[] = [
    `Current cumulative GPA: ${gpa.toFixed(2)}${targetGpa ? ` (target: ${targetGpa.toFixed(2)})` : ""}`,
    "",
    "Enrolled courses:",
  ];

  for (const c of courses) {
    const gradedCount = c.assignments.filter((a) => a.score !== null).length;
    const ungradedCount = c.assignments.filter((a) => a.score === null).length;
    const avgScore =
      gradedCount > 0
        ? (
            c.assignments
              .filter((a) => a.score !== null)
              .reduce((sum, a) => sum + (a.score ?? 0), 0) / gradedCount
          ).toFixed(1)
        : "—";
    lines.push(
      `• ${c.code} — ${c.name} (${c.credits} credits): current grade ${
        c.currentGrade > 0 ? c.currentGrade.toFixed(1) + "%" : "no grades yet"
      }, avg score ${avgScore}%, ${gradedCount} graded / ${ungradedCount} ungraded assignments`,
    );
  }

  const upcomingAssignments = courses
    .flatMap((c) =>
      c.assignments
        .filter((a) => a.score === null && a.dueDate)
        .map((a) => ({ courseCode: c.code, ...a })),
    )
    .sort((a, b) =>
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    )
    .slice(0, 8);

  if (upcomingAssignments.length > 0) {
    lines.push("", "Upcoming ungraded assignments:");
    for (const a of upcomingAssignments) {
      lines.push(`  - ${a.courseCode}: ${a.name} (${a.weight}% weight, due ${a.dueDate})`);
    }
  }

  return lines.join("\n");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── JWT auth ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  // ── Anthropic API key ──
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY secret not configured" }, 500);
  }

  // ── Parse body ──
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { courses, gpa, targetGpa } = body;
  if (!Array.isArray(courses)) {
    return jsonResponse({ error: "courses array is required" }, 400);
  }

  const context = buildContext(courses, gpa, targetGpa);

  const systemPrompt = `You are an expert academic advisor for a college student.
Your role is to provide personalized, actionable academic guidance based on their actual grade data.
Always be specific — reference actual course names, grades, assignment weights.
Be supportive but direct. Avoid generic platitudes.
Keep each section concise (2–4 sentences or bullet points max).`;

  const userPrompt = `Here is my current academic data:\n\n${context}\n\nPlease analyse my situation and respond with a JSON object (no markdown fences, just raw JSON) with exactly these keys:

{
  "assessment": "2-3 sentence overall assessment of my current academic standing",
  "priorities": [
    { "rank": 1, "title": "Short action title", "description": "Specific actionable recommendation", "impact": "high" },
    { "rank": 2, "title": "...", "description": "...", "impact": "medium" },
    { "rank": 3, "title": "...", "description": "...", "impact": "low" }
  ],
  "studyStrategies": [
    { "course": "COURSE_CODE", "strategy": "Specific study tip for this course" }
  ],
  "timeManagement": "2-3 sentences on managing workload given upcoming assignments",
  "motivation": "1-2 sentence motivational insight tied to specific progress or trends"
}

Impact levels: "high" (critical for GPA), "medium" (important), "low" (nice-to-have).
studyStrategies should focus on the 1-2 courses that need the most attention.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return jsonResponse({ error: "AI service error — please try again later" }, 502);
    }

    const aiResponse = await response.json();
    const rawContent: string = aiResponse.content?.[0]?.text ?? "";

    // Extract JSON — Claude occasionally wraps in backticks despite instructions
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", rawContent.slice(0, 200));
      return jsonResponse({ error: "Unexpected AI response format" }, 502);
    }

    const advice = JSON.parse(jsonMatch[0]);

    return jsonResponse({ success: true, data: advice });
  } catch (err) {
    console.error("ai-advisor error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
