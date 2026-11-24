import { createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/studio/Studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Library End-Panel Signage Studio" },
      { name: "description", content: "Design print-ready shelf end-panel signs for public libraries. Export 300 DPI PNG and PDF." },
      { property: "og:title", content: "Library End-Panel Signage Studio" },
      { property: "og:description", content: "Design print-ready shelf end-panel signs for public libraries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});
