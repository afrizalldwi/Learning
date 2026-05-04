import { describe, it, expect, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia().use(usersRoute);

describe("Users API Integration Tests", () => {
  beforeEach(async () => {
    // Menghapus data terlebih dahulu agar konsisten sesuai instruksi planning
    await db.delete(sessions);
    await db.delete(users);
  });

  describe("POST /api/users (Registration)", () => {
    it("should successfully register a new user with valid data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBe("OK");
    });

    it("should fail if payload is incomplete", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            // missing email and password
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail if validation (e.g. name length) is not met", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Te", // too short (minLength: 3)
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should fail if email is already registered", async () => {
      // Pre-register a user
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Existing User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New User",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toBe("email sudah terdaftar");
    });
  });

  describe("POST /api/users/login (Login)", () => {
    beforeEach(async () => {
      // Register a user for login tests
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Login User",
            email: "login@example.com",
            password: "correctpassword",
          }),
        })
      );
    });

    it("should successfully login and return a token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "correctpassword",
          }),
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBeDefined();
    });

    it("should fail if email is not found", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nonexistent@example.com",
            password: "password",
          }),
        })
      );

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error).toBe("email atau password salah");
    });

    it("should fail if password is wrong", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/users/current (Get Current User)", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Current User",
            email: "current@example.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "current@example.com",
            password: "password123",
          }),
        })
      );
      const loginData = await loginResponse.json();
      token = loginData.data;
    });

    it("should return user details with a valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data.email).toBe("current@example.com");
    });

    it("should fail if token is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });

    it("should fail if token is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": "Bearer invalid-token" },
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/users/current (Logout)", () => {
    let token: string;

    beforeEach(async () => {
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Logout User",
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );

      const loginResponse = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );
      const loginData = await loginResponse.json();
      token = loginData.data;
    });

    it("should successfully logout with a valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBe("OK");

      // Verify token is no longer valid
      const secondResponse = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}` },
        })
      );
      expect(secondResponse.status).toBe(401);
    });

    it("should fail logout if token is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
