export function resolvePublicAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  // Preserve local app assets (e.g. /images/eventix_background.png).
  if (value.startsWith('/')) {
    return value;
  }

  try {
    return new URL(value).toString();
  } catch {
    // Continue to resolve relative storage keys.
  }

  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!base) {
    return value;
  }

  const normalizedBase = base.replace(/\/$/, '');
  const normalizedValue = value.replace(/\/$/, '');
  if (normalizedValue === normalizedBase) {
    return null;
  }
  const normalizedPath = value.replace(/^\//, '');
  return `${normalizedBase}/${normalizedPath}`;
}
