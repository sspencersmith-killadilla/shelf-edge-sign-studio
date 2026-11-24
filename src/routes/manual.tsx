import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import manual from "../../docs/USER_MANUAL.md?raw";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "User Manual — End-Panel Sign Studio" },
      { name: "description", content: "How to design, batch, preflight and print library end-panel signs, plus self-hosting." },
      { property: "og:title", content: "User Manual — End-Panel Sign Studio" },
      { property: "og:description", content: "Step-by-step guide to designing and printing library shelf signs." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManualPage,
});

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) =>
    p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith("`") ? <code key={i} className="rounded bg-muted px-1 text-sm">{p.slice(1, -1)}</code> : p,
  );
}

function ManualPage() {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={blocks.length} className="mb-4 list-disc space-y-1.5 pl-6">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  for (const line of manual.split("\n")) {
    if (line.startsWith("- ")) { list.push(line.slice(2)); continue; }
    flush();
    if (line.startsWith("# ")) blocks.push(<h1 key={blocks.length} className="mb-6 text-3xl font-bold">{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={blocks.length} className="mb-3 mt-8 border-b border-border pb-1 text-xl font-semibold">{line.slice(3)}</h2>);
    else if (line.trim()) blocks.push(<p key={blocks.length} className="mb-3">{inline(line)}</p>);
  }
  flush();
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-foreground">
      <Link to="/" className="text-sm text-primary hover:underline">← Back to the studio</Link>
      <article className="mt-6 leading-relaxed">{blocks}</article>
      <section className="mt-10 rounded-lg border border-border bg-muted p-4 text-sm">
        <h2 className="mb-2 font-semibold">Host it yourself</h2>
        <p>This studio is free under the MIT License. To run it on your own computer: install Node.js, then run <code>npm install</code> and <code>npm run dev</code>. See HOSTING.md in the source code for Docker, intranet and Cloudflare setups.</p>
      </section>
    </main>
  );
}
