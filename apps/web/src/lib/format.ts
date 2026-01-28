export function formatDateRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const day = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const year = start.getFullYear();
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
  return `${day}, ${year} - ${startTime} - ${endTime}`;
}
