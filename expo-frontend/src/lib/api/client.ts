import { API_BASE_URL } from '@/lib/config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

type AuthHooks = {
  getToken: () => string | null;
  /** Called once per 401 so the session store can sign the user out. */
  onUnauthorized: () => void;
};

let auth: AuthHooks = { getToken: () => null, onUnauthorized: () => {} };

/** Wired up by the session store, which owns the token. */
export function configureApiAuth(hooks: AuthHooks) {
  auth = hooks;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Plain objects are sent as JSON; FormData as multipart. */
  body?: unknown;
  /** Skip the Authorization header (login, register, public endpoints). */
  anonymous?: boolean;
  signal?: AbortSignal;
};

/** Nest returns `message` as a string or, for validation errors, a list. */
function messageFrom(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.join(', ');
    if (message) return String(message);
  }
  return fallback;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  const token = anonymous ? null : auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    // fetch sets the multipart boundary itself.
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload, signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  // Nest sends an empty 200 body for a null result (e.g. GET /biodata/me
  // with no record yet), so don't assume there's JSON to parse.
  const text = await res.text();
  let data: unknown = null;
  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      auth.onUnauthorized();
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    throw new ApiError(messageFrom(data, `Something went wrong (${res.status}).`), res.status);
  }

  return data as T;
}
