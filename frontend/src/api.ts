export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (e: { loc?: string[]; msg: string }) =>
                  `${e.loc?.at(-1) ?? "Input"}: ${e.msg}`,
              )
              .join(". ")
          : `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
