export function loadSavedEventIds() {
  if (typeof window === 'undefined') {
    return [] as string[];
  }
  const stored = window.localStorage.getItem('eventix_saved_events');
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function persistSavedEventIds(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem('eventix_saved_events', JSON.stringify(ids));
}
