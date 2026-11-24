<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Signs render in CSS inches (96px/in) via `SignRenderer`; exports scale with `exportPixelRatio` for 300 DPI so preview and output match.
- Sign sizes are stored in inches internally; centimeters are converted only at the UI edge (`toUnit`/`fromUnit` in size.ts) so exports stay exact.
- Studio itself stays client-side; only optional branch sharing uses Lovable Cloud (libraries, library_members, shared_signs with member-scoped RLS; create/join via security-definer RPCs) so the app keeps working signed-out.
- AI sign-wording runs server-side in src/lib/ai (createServerFn + requireSupabaseAuth) so gateway credits are only spent by signed-in staff.
- QR/braille overlays are placed by measuring [data-txt] text rects in SignRenderer and calling placeOverlays; mark any new sign text with data-txt so placement and preflight see it.
