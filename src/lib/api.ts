import { getFirebaseServices } from "@/lib/firebase/client";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const { auth } = getFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new ApiError("Authentication is required.", 401, "UNAUTHENTICATED");

  const token = await user.getIdToken();
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({})) as {
    error?: { message?: string; code?: string };
  };
  if (!response.ok) {
    throw new ApiError(
      body.error?.message ?? "Request failed.",
      response.status,
      body.error?.code,
    );
  }

  return body as TResponse;
}
