// Pemanggil API dari browser. Semua endpoint aplikasi membalas JSON:
// sukses `{ data, meta? }`, gagal `{ error: { code, message, details? } }`.

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

const FALLBACK = "Permintaan belum berhasil. Coba lagi.";

export async function apiFetch<Data>(
  url: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<Data> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers:
        options.body === undefined
          ? undefined
          : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiClientError(
      "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (response.status === 204) return undefined as Data;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401)
      throw new ApiClientError(
        "Sesi kamu sudah berakhir. Masuk lagi untuk melanjutkan.",
        401,
        "UNAUTHORIZED",
      );
    const error = payload?.error;
    // Pesan validasi per isian lebih berguna daripada pesan umumnya.
    const message =
      error?.details?.[0]?.message ||
      (error?.code === "VALIDATION_ERROR" || error?.code === "INTERNAL_ERROR"
        ? FALLBACK
        : error?.message) ||
      FALLBACK;
    throw new ApiClientError(
      message,
      response.status,
      error?.code ?? "UNKNOWN",
      error?.details ?? [],
    );
  }
  return payload?.data as Data;
}

export function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : FALLBACK;
}
