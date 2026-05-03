import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logoutUser } from "../services/users-service";
import { UnauthorizedError } from "../errors/unauthorized-error";

export const usersRoute = new Elysia({ prefix: "/api" })
  .post("/users", async ({ body, set }) => {
    try {
      return await registerUser(body);
    } catch (error: any) {
      if (error.message === "email sudah terdaftar") {
        set.status = 400;
        return { error: error.message };
      }
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String(),
    })
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
    })
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
  });
