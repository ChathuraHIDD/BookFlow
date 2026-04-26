const truthy = new Set(['1', 'true', 'yes', 'y', 'on']);
const tokenCache = new Map();

export function mutationsEnabled() {
  return truthy.has(String(process.env.E2E_ALLOW_MUTATIONS || '').toLowerCase());
}

function rolePrefix(role) {
  return String(role || '').toUpperCase();
}

async function loginWithEnvCredentials(request, role) {
  const prefix = rolePrefix(role);
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];

  if (!email || !password) {
    return null;
  }

  const response = await request.post('/api/auth/login', {
    data: { email, password },
  });

  if (!response.ok()) {
    const message = await response.text();
    throw new Error(`Login failed for role ${role}: ${response.status()} ${message}`);
  }

  const body = await response.json();
  if (!body?.token) {
    throw new Error(`Login response for role ${role} did not contain a token`);
  }

  return body.token;
}

export async function getToken(request, role) {
  const prefix = rolePrefix(role);
  if (tokenCache.has(prefix)) {
    return tokenCache.get(prefix);
  }

  const envToken = process.env[`E2E_${prefix}_TOKEN`];
  if (envToken) {
    tokenCache.set(prefix, envToken);
    return envToken;
  }

  const loginToken = await loginWithEnvCredentials(request, role);
  if (loginToken) {
    tokenCache.set(prefix, loginToken);
    return loginToken;
  }

  throw new Error(
    `No authentication configured for role ${role}. Set E2E_${prefix}_TOKEN or E2E_${prefix}_EMAIL + E2E_${prefix}_PASSWORD.`,
  );
}

export async function requestAs(request, role, method, url, options = {}) {
  const token = await getToken(request, role);
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  return request.fetch(url, {
    ...options,
    method,
    headers,
  });
}

export async function jsonBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function isoDateOffset(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
