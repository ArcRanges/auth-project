const base64UrlToUtf8 = (input: string): string => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  return Buffer.from(padded, "base64").toString("utf8");
};

export const decodeJwtPayload = <T extends object>(
  token: string,
): T | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const json = base64UrlToUtf8(parts[1] ?? "");
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as T;
  } catch {
    return null;
  }
};

