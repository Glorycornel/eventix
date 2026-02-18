const SAVED_EVENTS_KEY = 'eventix_saved_events';

export function loadSavedEventIds() {
  if (typeof window === 'undefined') {
    return [] as string[];
  }
  const stored = window.localStorage.getItem(SAVED_EVENTS_KEY);
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
  window.localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('eventix:saved-events', { detail: ids }));
}

export function subscribeSavedEventIds(onChange: (ids: string[]) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    if (event.type === 'eventix:saved-events') {
      const customEvent = event as CustomEvent<string[]>;
      const detail = Array.isArray(customEvent.detail) ? customEvent.detail : loadSavedEventIds();
      onChange(detail);
      return;
    }

    if (event.type === 'storage') {
      const storageEvent = event as StorageEvent;
      if (storageEvent.key === SAVED_EVENTS_KEY) {
        onChange(loadSavedEventIds());
      }
    }
  };

  window.addEventListener('eventix:saved-events', handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('eventix:saved-events', handler);
    window.removeEventListener('storage', handler);
  };
}
