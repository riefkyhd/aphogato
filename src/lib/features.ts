/**
 * Central feature flags for aphogato.
 *
 * All flags default to true so behavior is unchanged until you flip one off.
 * Use in UI only — do not gate API routes, database queries, auth, or layout shell.
 */
export const FEATURES = {
  /** Projects grid list at /dashboard */
  projectsGrid: true,

  /** Kanban pipeline board at /dashboard/board */
  projectPipeline: true,

  /** Create-new-project form at /dashboard/new */
  newProject: true,

  /** Single-project admin page at /dashboard/[id] (gallery, actions, tools) */
  projectDetail: true,

  /** Client-facing photo gallery at /gallery/[token] */
  clientGallery: true,

  /** Client tap-to-select photos and confirm selection in the gallery */
  clientPhotoSelection: true,

  /** Face search — admin indexing settings, upload indexing, and client "Find my photos" */
  faceSearch: false,

  /** Shoot calendar at /dashboard/calendar */
  calendar: true,

  /** Finance dashboard — income, expenses, charts, profitability at /dashboard/finance */
  finance: true,

  /** Client CRM at /dashboard/clients */
  clients: true,

  /** Price list at /dashboard/pricing */
  pricing: true,

  /** Quotation builder and archive at /dashboard/quotations */
  quotations: true,

  /** Invoice builder at /dashboard/invoices */
  invoices: true,

  /** Settings hub at /dashboard/settings */
  settings: true,

  /** Per-project and per-event deliverables checklist */
  deliverables: true,

  /** Project moodboard / reference images and PDF export */
  projectReferences: true,

  /** "Open in Bridge" Lightroom handoff from project actions */
  bridgeExport: true,

  /** Google Calendar OAuth connect, sync, and event push */
  googleCalendarSync: true,

  /** Finance PIN lock, masked amounts, and privacy-gated actions */
  privacyLock: true,

  /** Today's shoots banner on dashboard and browser notification settings */
  todayShootsReminder: true,

  /** Cloudinary account picker, usage bars, and project usage badges */
  cloudinarySettings: true,

  /** Domain verification / DNS security guide at /dashboard/settings/domain-verification */
  domainVerification: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;
