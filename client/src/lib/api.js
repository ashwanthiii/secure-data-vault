function resolveApiBase() {
  const configured = (import.meta.env.VITE_API_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return '/api';
}

const API = resolveApiBase();

async function parseBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function api(path, options = {}) {
  const timeoutMs = options.body instanceof FormData ? 120000 : 5000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
      headers:
        options.body instanceof FormData
          ? options.headers
          : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    const error = new Error('Network error. Please check your connection and try again.');
    error.code = 'network_error';
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await parseBody(res);
  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.');
    error.code = data.code;
    error.status = res.status;
    error.receiverEmail = data.receiverEmail;
    throw error;
  }
  return data;
}

export async function downloadProtectedFile(fileId, guestAccessToken = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let res;
  try {
    res = await fetch(`${API}/files/${fileId}/download`, {
      credentials: 'include',
      signal: controller.signal,
      headers: guestAccessToken ? { Authorization: `Bearer ${guestAccessToken}` } : undefined,
    });
  } catch {
    const error = new Error('Network error. Please check your connection and try again.');
    error.code = 'network_error';
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const data = await parseBody(res);
    const error = new Error(data.message || 'Unable to download this file.');
    error.code = data.code || 'download_failure';
    error.status = res.status;
    throw error;
  }

  return {
    buffer: await res.arrayBuffer(),
    fileKeyB64: res.headers.get('X-File-Key'),
    filename: decodeURIComponent(res.headers.get('X-File-Name') || 'file'),
    mimeType: res.headers.get('X-File-Type') || 'application/octet-stream',
  };
}
