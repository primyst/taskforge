import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(5).max(1000),
});

const aiTaskSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional().default(""),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
      })
    )
    .min(1)
    .max(10),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`ai:generate:${session.user.id}`, 5, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "AI generation limit reached. Try again in an hour." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, prompt } = parsed.data;

  try {
    await requireProjectAccess(session.user.id, projectId);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a project planning assistant. Given a project goal, break it into 3-8 concrete, actionable tasks. " +
            "Return ONLY valid JSON matching this exact shape, with no markdown formatting, no code fences, and no explanation: " +
            '{"tasks":[{"title":"string","description":"string","priority":"LOW"|"MEDIUM"|"HIGH"|"URGENT"}]}',
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const rawText = completion.choices[0]?.message?.content ?? "";

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "AI returned an unexpected format. Try rephrasing your prompt." },
        { status: 502 }
      );
    }

    const validated = aiTaskSchema.safeParse(parsedJson);
    if (!validated.success) {
      return NextResponse.json(
        { error: "AI output failed validation. Try rephrasing your prompt." },
        { status: 502 }
      );
    }

    const userId = session.user.id;

    const createdTasks = await prisma.$transaction(
      validated.data.tasks.map((t) =>
        prisma.task.create({
          data: {
            title: t.title,
            description: t.description,
            priority: t.priority,
            projectId,
            createdById: userId,
            aiGenerated: true,
          },
        })
      )
    );

    return NextResponse.json({ tasks: createdTasks }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}