"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignored: clipboard may be unavailable
    }
  }

  return (
    <div className="card mx-auto flex max-w-md items-stretch overflow-hidden">
      <div className="flex-1 truncate px-4 py-3 text-left text-sm text-slate-700">
        {url}
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-2 bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
