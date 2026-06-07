export class UploadCancelledError extends Error {
  constructor() {
    super("Upload cancelled");
    this.name = "UploadCancelledError";
  }
}

export function isUploadCancelled(error: unknown): boolean {
  return error instanceof UploadCancelledError;
}
