const ADMIN_PIN = "2005";

export async function verifyAdminPin(pin: string): Promise<boolean> {
  return String(pin ?? "").trim() === ADMIN_PIN;
}
