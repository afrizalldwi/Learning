import { mock, describe, it, expect } from "bun:test";

// Mock the database
mock.module("../db", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    delete: () => ({ where: () => {} }),
  },
}));

// Mock the service
mock.module("../services/users-service", () => ({
  registerUser: async () => ({ data: "OK" }),
  loginUser: async () => ({ data: "token" }),
  getCurrentUser: async () => ({ data: {} }),
  logoutUser: async (token: string) => {
    if (token === "valid-token") {
      return { data: "OK" };
    }
    const { UnauthorizedError } = require("../errors/unauthorized-error");
    throw new UnauthorizedError();
  },
}));

import { Elysia } from "elysia";
const { usersRoute } = require("./users-route");

const app = new Elysia().use(usersRoute);

describe("Logout API", () => {
  it("should return OK with valid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "DELETE",
        headers: { Authorization: "Bearer valid-token" },
      })
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toBe("OK");
  });

  it("should return 401 with invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "DELETE",
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
        method: "DELETE",
      })
    );

    expect(response.status).toBe(401);
  });
});
