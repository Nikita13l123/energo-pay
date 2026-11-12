export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось выполнить запрос";
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");

  if (options.method && options.method !== "GET") {
    const csrf = await request<{ token: string; headerName: string }>(
      "/auth/csrf",
    );
    headers.set(csrf.headerName, csrf.token);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new Error(
      "Нет связи с сервером. Проверьте подключение и повторите попытку.",
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new Event("session-expired"));
    }
    const fields = body?.errors ? Object.values(body.errors).join(". ") : "";
    throw new ApiError(
      response.status,
      fields || body?.message || `Ошибка сервера (${response.status})`,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
