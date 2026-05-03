import { mock, describe, it, expect } from "bun:test";

// Mock the database
mock.module("../db", () => ({
  db: {
    select: () => ({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => [] }) }) }) }),
    insert: () => ({ values: () => {} }),
  },
}));

// Mock the service
mock.module("../services/users-service", () => ({
  registerUser: async () => ({ data: "OK" }),
  loginUser: async () => ({ data: "token" }),
  getCurrentUser: async (token: string) => {
    if (token === "valid-token") {
      return {
        data: {
          id: 1,
          name: "afrizal",
          email: "afrizal@localhost",
          createdAt: new Date().toISOString(),
        },
      };
    }
    const { UnauthorizedError } = require("../errors/unauthorized-error");
    throw new UnauthorizedError();
  },
  logoutUser: async () => ({ data: "OK" }),
}));
import { Elysia } from "elysia";
const { usersRoute } = require("./users-route");

const app = new Elysia().use(usersRoute);

describe("Get Current User API", () => {
  it("should return user data with valid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.name).toBe("afrizal");
    expect(result.data.email).toBe("afrizal@localhost");
  });

  it("should return 401 with invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: "Bearer invalid-token" },
      })
    );

    expect(response.status).toBe(401);
    const result = await response.json();
    expect(result.error).toBe("Unauthorized");
  });

  it("should return 401 with missing header", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(response.status).toBe(401);
  });

  it("should return 401 with malformed header", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: "token-without-bearer" },
      })
    );

    expect(response.status).toBe(401);
  });
});
