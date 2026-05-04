import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";
import { UnauthorizedError } from "../errors/unauthorized-error";

export const usersRoute = new Elysia({ prefix: "/api" })
  .post("/users", async ({ body, set }) => {
    try {
      return await registerUser(body);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message === "email sudah terdaftar") {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 3, maxLength: 255 }),
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ minLength: 8, maxLength: 255 }),
    }),
    detail: {
      tags: ["Users"],
      summary: "Registrasi Pengguna Baru",
      description: "Endpoint ini digunakan untuk mendaftarkan akun baru ke dalam sistem.",
      responses: {
        200: {
          description: "Registrasi Berhasil",
          content: {
            "application/json": {
              schema: t.Object({
                data: t.String()
              }),
              example: { data: "OK" }
            }
          }
        },
        400: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "email sudah terdaftar" }
            }
          }
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "Internal Server Error" }
            }
          }
        }
      }
    }
  })
  .post("/users/login", async ({ body, set }) => {
    try {
      return await loginUser(body);
    } catch (error: any) {
      if (error.message === "email atau password salah") {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
    detail: {
      tags: ["Users"],
      summary: "Login Pengguna",
      description: "Endpoint ini digunakan untuk melakukan otentikasi pengguna dan mendapatkan token sesi.",
      responses: {
        200: {
          description: "Login Berhasil",
          content: {
            "application/json": {
              schema: t.Object({
                data: t.String()
              }),
              example: { data: "550e8400-e29b-41d4-a716-446655440000" }
            }
          }
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "email atau password salah" }
            }
          }
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "Internal Server Error" }
            }
          }
        }
      }
    }
  })
  .guard({
    beforeHandle: ({ headers, set }) => {
      const auth = headers["authorization"];
      if (!auth || !auth.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    }
  })
  .derive(({ headers }) => {
    const auth = headers["authorization"];
    return {
      token: auth?.slice(7) ?? ""
    };
  })
  .get("/users/current", async ({ token, set }) => {
    try {
      return await getCurrentUser(token);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    detail: {
      tags: ["Users"],
      summary: "Dapatkan Profil Pengguna Saat Ini",
      description: "Endpoint ini digunakan untuk mendapatkan informasi detail pengguna yang sedang login berdasarkan token.",
      responses: {
        200: {
          description: "Berhasil mendapatkan profil",
          content: {
            "application/json": {
              schema: t.Object({
                data: t.Object({
                  id: t.Any(),
                  name: t.String(),
                  email: t.String(),
                  createdAt: t.Any()
                })
              }),
              example: {
                data: {
                  id: 1,
                  name: "John Doe",
                  email: "john@example.com",
                  createdAt: "2023-01-01T00:00:00.000Z"
                }
              }
            }
          }
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "Unauthorized" }
            }
          }
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "Internal Server Error" }
            }
          }
        }
      }
    }
  })
  .delete("/users/current", async ({ token, set }) => {
    try {
      return await logoutUser(token);
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    detail: {
      tags: ["Users"],
      summary: "Logout Pengguna",
      description: "Endpoint ini digunakan untuk mengakhiri sesi pengguna dan membatalkan token.",
      responses: {
        200: {
          description: "Logout Berhasil",
          content: {
            "application/json": {
              schema: t.Object({
                data: t.String()
              }),
              example: { data: "OK" }
            }
          }
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "Unauthorized" }
            }
          }
        },
        500: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: t.Object({
                error: t.String()
              }),
              example: { error: "Internal Server Error" }
            }
          }
        }
      }
    }
  });
