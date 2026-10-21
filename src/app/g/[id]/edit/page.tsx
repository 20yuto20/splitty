import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EditGroupForm } from "@/components/EditGroupForm";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function EditGroupPage({ params }: Props) {
  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { createdAt: "asc" },
        include: {
          paidFor: { select: { id: true }, take: 1 },
          shares: { select: { id: true }, take: 1 },
        },
      },
    },
  });
  if (!group) notFound();

  return (
    <div className="space-y-6 pt-2">
      <h1 className="text-2xl font-bold text-slate-900">Edit group</h1>
      <EditGroupForm
        groupId={group.id}
        currentName={group.name}
        members={group.members.map((m) => ({
          id: m.id,
          name: m.name,
          inUse: m.paidFor.length > 0 || m.shares.length > 0,
        }))}
      />
    </div>
  );
}
