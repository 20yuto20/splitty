import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { newGroupId } from "@/lib/id";
import { CURRENCIES } from "@/lib/currency";

const Schema = z.object({
  name: z.string().trim().min(1).max(80),
  currency: z.enum(CURRENCIES.map((c) => c.code) as [string, ...string[]]),
  members: z
    .array(z.string().trim().min(1).max(40))
    .min(2)
    .max(50)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Member names must be unique.",
    }),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { name, currency, members } = parsed.data;
  const id = newGroupId();

  const group = await prisma.group.create({
    data: {
      id,
      name,
      currency,
      members: { create: members.map((n) => ({ name: n })) },
    },
  });

  return NextResponse.json({ id: group.id }, { status: 201 });
}
