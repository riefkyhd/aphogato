export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "Server returned an invalid response"
        : `Request failed (${res.status})`
    );
  }
}
