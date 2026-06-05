1. "Client" to "Client Selection" for clarity
2. add information to every hover of an icon, for example if theres a trash icon, when user hover, please show tooltip/info of it
3. is there any verification when i enter the domain in vercel? what if other user change their domain to lets say [xyz.muhammad-hadid.com](http://xyz.muhammad-hadid.com)  
  
what will happen? any verification?
4. in mobile, when user click a menu they're in, close the dropdown just like other behavior
5. smoothen all the animation, add to parts that needs animation
6. add day information in the calendar
7. add info to share/download calendar as list
8. export report
9. add client book/dictionary. auto add from creating project.
10. Price list generation
11. add pin. to unlock finance menu, so later when user click, finance menu will appear in very blur, with pop up modal to enter pin. this will also happen in lets say project deletion or other sensitive operation.  
or just add feature to show/hide numbers in finance, just like bibit
12. add reference for each project if any. and have the capability to export the moodboard to a pdf for ease of use
13. expand to a client photo delivery. maybe should increase storage. or maybe should use gdrive API, so i can upload it via gdrive, and show it in my gallery
14. analyze how much to invest in a year so this will be mass production ready for one subscription
15. think about the payment gateaway, for global user
16. finance can be unrelated to project, like add expense for gdrive, lightroom, etc
17. dark/light mode

• 18. add deliverables checklist for every project/calendar

---

## Implementation priority

Ordered by **impact vs effort** and **what unblocks daily use** before bigger bets.  
Items already partly in the app are noted.

| Priority | # | Item | Why this order |
|----------|---|------|----------------|
| **P0 — Do first** (quick wins, 1–3 days total) | 1 | Client → Client Selection rename | Trivial copy fix; removes confusion immediately. |
| | 4 | Mobile: close menu when tapping current page | Small UX bug; matches expected nav behavior. |
| | 2 | Tooltips on icon-only controls | Low effort; helps on dashboard, calendar, gallery, finance. |
| | 6 | Day information on calendar | High daily value for scheduling; builds on existing calendar. |
| | 7 | Info for share/download calendar as list | Mostly copy + help text; pairs with #6. |
| | 16 | Finance unrelated to project (GDrive, Lightroom, etc.) | **Partially done** — polish Finance UX for “general” overhead without project/event link. |
| **P1 — Core workflow** (next 2–4 weeks) | 18 | Deliverables checklist per project/calendar | Ties shoots to delivery; natural extension of calendar + projects. |
| | 9 | Client book / dictionary (auto from new project) | Foundation for #10 and fewer re-typed client names. |
| | 8 | Export report | Finance module exists; high value for tax/recap. |
| | 12 | Project reference + moodboard PDF export | Useful per shoot; moderate scope (upload refs + PDF). |
| | 10 | Price list generation | Depends on #9 + finance patterns; client-facing revenue tool. |
| **P2 — Trust & privacy** (before wider client use) | 11 | PIN or hide finance numbers (Bibit-style) | Protects sensitive totals on shared screens; reuse for delete.confirm. |
| | 3 | Vercel custom domain verification | **Research/doc first** — explain hijack risk; then DNS/ownership checks if needed. |
| **P3 — Polish** (when P0–P1 stable) | 5 | Smoother animations | Cross-cutting; do after layout/flows stop changing. |
| | 17 | Dark / light mode | Design-token pass across all pages; larger than it looks. |
| **P4 — Strategic / large** (defer until product fit) | 13 | Client delivery at scale (storage vs Google Drive API) | Architecture + cost; blocks on storage/bandwidth strategy. |
| | 15 | Payment gateway (global) | Product/business decision; multi-tenant level effort. |
| | 14 | Yearly cost analysis for one-subscription scale | Planning/research; inform #13 and #15, not a feature sprint. |

### Suggested sprint sequence

1. **Sprint A (polish):** 1 → 4 → 2 → 6 → 7 → 16  
2. **Sprint B (workflow):** 18 → 9 → 8  
3. **Sprint C (client deliverables):** 12 → 10  
4. **Sprint D (safety):** 11 → 3  
5. **Backlog:** 5 → 17 → 13 → 15 → 14

### Not recommended first

- **#14, #15** — Business/research; no code until solo workflow is complete.  
- **#13** — Large storage/integration change; finish gallery + finance workflows first.  
- **#17** — Touches every screen; better after UI structure settles (post P0–P1).