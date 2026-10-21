import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      expenses: {
        orderBy: { createdAt: "desc" },
        include: {
          payer: true,
          shares: { include: { member: true } },
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  return NextResponse.json(group);
}

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  addMembers: z.array(z.string().trim().min(1).max(40)).max(50).optional(),
  removeMemberIds: z.array(z.string()).max(50).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { name, addMembers, removeMemberIds } = parsed.data;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (name !== undefined) {
      await tx.group.update({ where: { id: group.id }, data: { name } });
    }

    if (addMembers && addMembers.length) {
      const existing = new Set(group.members.map((m) => m.name));
      const fresh = addMembers.filter((n) => !existing.has(n));
      if (fresh.length) {
        await tx.member.createMany({
          data: fresh.map((n) => ({ groupId: group.id, name: n })),
        });
      }
    }

    if (removeMemberIds && removeMemberIds.length) {
      // Refuse to remove a member who's already involved in any expense.
      const involved = await tx.expenseShare.findMany({
        where: { memberId: { in: removeMemberIds } },
        select: { memberId: true },
      });
      const paid = await tx.expense.findMany({
        where: { payerId: { in: removeMemberIds } },
        select: { payerId: true },
      });
      const blocked = new Set([
        ...involved.map((i) => i.memberId),
        ...paid.map((p) => p.payerId),
      ]);
      const removable = removeMemberIds.filter((id) => !blocked.has(id));
      if (removable.length) {
        await tx.member.deleteMany({
          where: { id: { in: removable }, groupId: group.id },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
