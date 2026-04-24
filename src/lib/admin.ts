export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || '';
}

export function isAdminEmail(email?: string | null) {
  const adminEmail = getAdminEmail();
  return Boolean(email && adminEmail && email === adminEmail);
}
