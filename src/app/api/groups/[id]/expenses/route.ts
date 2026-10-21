import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Schema = z.object({
  description: z.string().trim().min(1).max(120),
  amount: z.number().int().positive().max(1_000_000_000),
  payerId: z.string().min(1),
  shares: z
    .array(
      z.object({
        memberId: z.string().min(1),
        amount: z.number().int().nonnegative().max(1_000_000_000),
      }),
    )
    .min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { description, amount, payerId, shares } = parsed.data;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const memberIds = new Set(group.members.map((m) => m.id));
  if (!memberIds.has(payerId)) {
    return NextResponse.json({ error: "Payer is not a group member." }, { status: 400 });
  }
  for (const s of shares) {
    if (!memberIds.has(s.memberId)) {
      return NextResponse.json({ error: "Share refers to a non-member." }, { status: 400 });
    }
  }

  const filteredShares = shares.filter((s) => s.amount > 0);
  if (filteredShares.length === 0) {
    return NextResponse.json(
      { error: "At least one participant must owe a non-zero amount." },
      { status: 400 },
    );
  }

  const sum = filteredShares.reduce((a, s) => a + s.amount, 0);
  if (sum !== amount) {
    return NextResponse.json(
      { error: `Shares (${sum}) must add up to the total (${amount}).` },
      { status: 400 },
    );
  }

  const expense = await prisma.expense.create({
    data: {
      groupId: group.id,
      payerId,
      description,
      amount,
      shares: { create: filteredShares },
    },
  });

  return NextResponse.json({ id: expense.id }, { status: 201 });
}
