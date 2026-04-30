import { CreateGroupForm } from "@/components/CreateGroupForm";
import { Coins, Receipt, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12 pt-4">
      <section className="space-y-4 text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Split expenses,
          <br className="sm:hidden" />{" "}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            settle up easily.
          </span>
        </h1>
        <p className="mx-auto max-w-md text-base text-slate-600 sm:mx-0">
          Splitty figures out who owes whom after a trip, dinner, or shared house.
          No sign-up required — just create a group and share the link.
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Create a group</h2>
        <CreateGroupForm />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Feature
          icon={<Users className="h-5 w-5" />}
          title="Add members"
          body="Invite as many friends as you need. No accounts required."
        />
        <Feature
          icon={<Receipt className="h-5 w-5" />}
          title="Log expenses"
          body="Quick equal split, or custom amounts per person."
        />
        <Feature
          icon={<Coins className="h-5 w-5" />}
          title="See who owes whom"
          body="Splitty minimizes the number of payments to settle up."
        />
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
