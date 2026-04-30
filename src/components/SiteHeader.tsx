import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-6">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-7 w-7" />
        <span className="text-lg font-bold tracking-tight text-slate-900">Splitty</span>
      </Link>
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        New group
      </Link>
    </header>
  );
}
