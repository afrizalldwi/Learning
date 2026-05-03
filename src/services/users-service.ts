import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

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
