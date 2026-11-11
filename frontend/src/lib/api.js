import { bacaToken, versiSesi, hapusSesi, sesi } from "./sesi.js";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export async function api(path, opsi = {}) {
  const { method = "GET", body, auth = false, signal } = opsi;
  const versiAwal = versiSesi();
  const token = auth ? bacaToken() : "";
  if (auth && (!token || sesi.keluar)) {
    // Logout sendiri masih boleh mengirim token.
    if (!(path === "/api/auth/logout" && token)) {
      throw new ApiError(401, "AUTH_REQUIRED", "Silakan login lagi.");
    }
  }
  const headers = { Accept: "application/json" };
  if (body !== undefined)
    headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${token}`;
  let response;
  let hasil;
  try {
    response = await fetch(path, {
      method,
      headers,
      signal,
      cache: "no-store",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status !== 204) {
      const jenis = response.headers.get("content-type") ?? "";
      if (!jenis.includes("application/json")) {
        throw new ApiError(
          response.status,
          "NON_JSON",
          "Respons bukan JSON. Periksa backend dan proxy Vite.",
        );
      }
      hasil = await response.json();
    }
  } catch (error) {
    if (error.name === "AbortError" || error instanceof ApiError)
      throw error;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Koneksi atau respons bermasalah. Periksa layanan " +
        "dan coba muat ulang.",
    );
  }
  // Respons dari sesi lama tidak boleh mengubah sesi baru.
  if (auth && versiAwal !== versiSesi()) {
    throw new DOMException("Sesi telah berubah.", "AbortError");
  }
  if (!response.ok) {
    if (auth && response.status === 401) {
      hapusSesi("Sesi tidak berlaku. Silakan login lagi.");
    }
    throw new ApiError(
      response.status,
      hasil?.error?.code ?? "HTTP_ERROR",
      hasil?.error?.message ?? "Permintaan tidak dapat diproses.",
    );
  }
  if (response.status === 204) return null;
  if (hasil?.success !== true) {
    throw new ApiError(
      response.status,
      "BAD_RESPONSE",
      "Format respons tidak sesuai kontrak API.",
    );
  }
  return hasil;
}
export function pesanError(error) {
  return error instanceof ApiError
    ? `${error.status || "Koneksi"} ${error.code}: ${error.message}`
    : "Terjadi kesalahan. Periksa Console tanpa menampilkan token.";
}
