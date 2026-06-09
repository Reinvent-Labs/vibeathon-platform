const attempts = new Map<string, number[]>();

export function allowRequest(
  key: string,
  maximum: number,
  windowMilliseconds: number,
) {
  const now = Date.now();
  const cutoff = now - windowMilliseconds;
  const recent = (attempts.get(key) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );
  if (recent.length >= maximum) return false;
  attempts.set(key, [...recent, now]);
  return true;
}
