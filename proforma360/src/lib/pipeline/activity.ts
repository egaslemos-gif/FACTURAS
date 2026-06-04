export function getCurrentISOTime() {
  return new Date().toISOString();
}

/**
 * Updates the last_activity_at timestamp for any operational activity.
 */
export function updateLastActivity(data: Partial<any>): Partial<any> {
  return {
    ...data,
    last_activity_at: getCurrentISOTime()
  };
}

/**
 * Updates both last_activity_at and last_contact_at.
 * Use ONLY when an actual interaction with the client occurred (WhatsApp, Email, Call, etc).
 */
export function updateLastContact(data: Partial<any>): Partial<any> {
  const now = getCurrentISOTime();
  return {
    ...data,
    last_activity_at: now,
    last_contact_at: now
  };
}
