import { prisma } from "@/lib/db";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      expenses: {
        orderBy: { createdAt: "asc" },
        include: {
          payer: true,
          shares: { include: { member: true } },
        },
      },
    },
  });

  if (!group) {
    return new Response("Group not found", { status: 404 });
  }

  const header = ["Date", "Description", "Amount", "Currency", "Paid by", "Participants"];
  const rows = group.expenses.map((e) => {
    const participants = e.shares
      .map((s) => `${s.member.name}:${s.amount}`)
      .join(" | ");
    return [
      e.createdAt.toISOString().slice(0, 10),
      e.description,
      String(e.amount),
      group.currency,
      e.payer.name,
      participants,
    ]
      .map(csvEscape)
      .join(",");
  });

  const body = [header.join(","), ...rows].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="splitty-${group.id}.csv"`,
    },
  });
}
