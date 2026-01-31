/**
 * Decodifica o payload do JWT (apenas leitura; não valida assinatura).
 * Uso: verificar companyId no client para UI (ex.: mostrar seletor de empresa para Super Admin).
 */
export function decodeJwtPayload(token: string): { sub?: string; companyId?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof atob !== "undefined" ? atob(base64) : Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as { sub?: string; companyId?: string };
  } catch {
    return {};
  }
}

export function isSuperAdmin(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return payload.companyId === "admin";
}
