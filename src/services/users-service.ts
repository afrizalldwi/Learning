import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "../errors/unauthorized-error";

/**
 * Mendaftarkan pengguna baru ke dalam database.
 * Fungsi ini akan mengecek apakah email sudah terdaftar sebelumnya.
 * Jika belum, data pengguna baru akan disimpan ke tabel `users`.
 * 
 * @param data - Objek berisi informasi pengguna (name, email, password)
 * @returns Objek dengan properti `data` bernilai "OK" jika registrasi berhasil
 * @throws Error jika email sudah terdaftar
 */
export const registerUser = async (data: typeof users.$inferInsert) => {
  // Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  // Insert user
  await db.insert(users).values(data);

  return { data: "OK" };
};

/**
 * Melakukan proses otentikasi pengguna (login).
 * Mengecek kecocokan email dan password di database. Jika cocok,
 * akan men-generate UUID token baru dan menyimpannya di tabel `sessions`.
 * 
 * @param data - Objek berisi kredensial login (email, password)
 * @returns Objek dengan properti `data` berisi token sesi (UUID string)
 * @throws Error jika email tidak ditemukan atau password salah
 */
export const loginUser = async (data: Pick<typeof users.$inferSelect, "email" | "password">) => {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (!user || user.password !== data.password) {
    throw new Error("email atau password salah");
  }

  // Generate token
  const token = crypto.randomUUID();

  // Create session
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { data: token };
};

/**
 * Mengambil detail profil pengguna yang sedang login berdasarkan token sesi.
 * Fungsi ini melakukan join antara tabel `sessions` dan `users` untuk 
 * memverifikasi token dan mengambil data pengguna terkait.
 * 
 * @param token - String token otorisasi dari header permintaan
 * @returns Objek dengan properti `data` berisi detail pengguna (id, name, email, createdAt)
 * @throws UnauthorizedError jika token tidak valid atau tidak ditemukan
 */
export const getCurrentUser = async (token: string) => {
  const [result] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result) {
    throw new UnauthorizedError();
  }

  return { data: result };
};

/**
 * Mengakhiri sesi pengguna (logout).
 * Fungsi ini akan menghapus baris data sesi dari tabel `sessions`
 * berdasarkan token yang diberikan.
 * 
 * @param token - String token otorisasi sesi yang ingin dihapus
 * @returns Objek dengan properti `data` bernilai "OK" jika penghapusan berhasil
 * @throws UnauthorizedError jika token tidak valid atau tidak ada sesi yang dihapus
 */
export const logoutUser = async (token: string) => {
  const [result]: any = await db.delete(sessions).where(eq(sessions.token, token));

  if (result.affectedRows === 0) {
    throw new UnauthorizedError();
  }

  return { data: "OK" };
};
