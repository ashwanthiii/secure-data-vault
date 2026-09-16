export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatExpiresAt(iso, timeZone) {
  if (!iso) return '';
  const date = new Date(iso);
  const zone = timeZone || browserTimezone();
  const time = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  const dayKey = (value) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);

  const today = dayKey(new Date());
  const target = dayKey(date);
  const tomorrow = dayKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

  if (target === today) return `Today, ${time}`;
  if (target === tomorrow) return `Tomorrow, ${time}`;

  const datePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
  return `${datePart}, ${time}`;
}

export function formatHistoryDate(iso, timeZone) {
  if (!iso) return 'Not yet';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone || browserTimezone(),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatHistoryDateTime(iso, timeZone) {
  if (!iso) return 'Not yet';
  const date = new Date(iso);
  const zone = timeZone || browserTimezone();
  const datePart = formatHistoryDate(iso, zone);
  const timePart = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return `${datePart}, ${timePart}`;
}

export function formatMemberSince(iso, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || browserTimezone(),
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatTimezoneLabel(timeZone) {
  const zone = timeZone || browserTimezone();
  try {
    const now = new Date();
    const offset =
      new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        timeZoneName: 'longOffset',
      })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')?.value || '';
    const long =
      new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        timeZoneName: 'long',
      })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')?.value || zone;
    return `(${offset.replace('GMT', 'UTC')}) ${long}`;
  } catch {
    return zone;
  }
}

export function initials(name) {
  return (
    String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'U'
  );
}

export function futureIsoFromMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}
