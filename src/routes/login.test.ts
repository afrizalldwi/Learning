import { describe, it, expect, mock } from "bun:test";
import { Elysia } from "elysia";

// Mock the database
mock.module("../db", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    insert: () => ({ values: () => {} }),
  },
}));

// Mock the service
mock.module("../services/users-service", () => ({
  registerUser: async () => ({ data: "OK" }),
  loginUser: async (body: any) => {
    if (body.email === "test@example.com" && body.password === "correct") {
      return { data: "mocked-uuid-token" };
    }
    throw new Error("email atau password salah");
  },
}));

// Import the route
import { usersRoute } from "./users-route";

const app = new Elysia().use(usersRoute);

describe("User Login API", () => {
  it("should return token on successful login", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "correct",
        }),
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ data: "mocked-uuid-token" });
  });

  it("should return 401 if credentials are invalid", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrong",
        }),
      })
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: "email atau password salah" });
  });

  it("should return 400 on validation failure", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          // missing password
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
