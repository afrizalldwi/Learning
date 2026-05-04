import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Belajar Vibe Coding API Documentation',
        version: '1.0.0',
        description: 'Dokumentasi interaktif untuk manajemen pengguna API.'
      }
    }
  }))
  .use(usersRoute)
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
