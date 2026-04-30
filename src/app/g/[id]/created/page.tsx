import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { ShareLink } from "@/components/ShareLink";

type Props = { params: { id: string } };

export default async function CreatedPage({ params }: Props) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });
  if (!group) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = `${base}/g/${group.id}`;

  return (
    <div className="space-y-8 pt-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/10 text-accent-600">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Group created</h1>
        <p className="text-slate-600">
          Share the link below with the rest of <strong>{group.name}</strong> so
          everyone can log expenses.
        </p>
      </div>

      <ShareLink url={url} />

      <Link href={`/g/${group.id}`} className="btn-primary inline-flex">
        Go to group
      </Link>
    </div>
  );
}
