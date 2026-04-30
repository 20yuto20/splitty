import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-6 pt-12 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Group not found</h1>
      <p className="text-slate-600">
        The link may have a typo, or the group has been deleted.
      </p>
      <Link href="/" className="btn-primary inline-flex">
        Create a new group
      </Link>
    </div>
  );
}
