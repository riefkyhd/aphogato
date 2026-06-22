export function l2NormalizeEmbedding(values: number[] | Float32Array): number[] {
  let sumSquares = 0;
  for (let i = 0; i < values.length; i++) {
    sumSquares += values[i] * values[i];
  }
  const norm = Math.sqrt(sumSquares);
  if (!Number.isFinite(norm) || norm === 0) {
    return Array.from(values);
  }
  return Array.from(values, (value) => value / norm);
}
