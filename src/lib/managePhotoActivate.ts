export type ManagePhotoActivateMeta = {
  ctrlKey: boolean;
  metaKey: boolean;
  longPress?: boolean;
  /** Keyboard navigation: always expand and single-select without toggle-collapse */
  forceNavigate?: boolean;
};

export function isMultiSelectActivate(meta: ManagePhotoActivateMeta): boolean {
  return Boolean(meta.ctrlKey || meta.metaKey || meta.longPress);
}
