import { env } from "./env.ts";
import { db } from "../index.ts";

type SupabaseUser = {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: string;
  };
  app_metadata: {
    role?: string;
  };
};

type SupabaseUsersResponse = {
  users: SupabaseUser[];
};

const prisma = db

const SUPABASE_URL =
  env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";
const SERVICE_ROLE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY environment variable",
    );
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  console.log("Fetching users from Supabase Auth...");

  // Fetch all users from Supabase Auth
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "GET",
    headers: {
      APIKey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch users: ${response.statusText}`);
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  const data: SupabaseUsersResponse = await response.json();
  const users = data.users ?? [];

  console.log(`Found ${users.length} users in Supabase Auth`);

  for (const user of users) {
    const role = user.app_metadata?.role ?? user.user_metadata?.role ?? "user";
    const name = user.user_metadata?.name ?? user.email.split("@")[0];

    // Determine permissions based on role
    const isAdmin = role === "admin" || role === "tech";
    const isModerator = role === "moderator";
    const isServiceAccount = role === "service";

    try {
      // First, try to find existing user by email or authUserId
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: user.email }, { authUserId: user.id }],
        },
      });

      if (existingUser) {
        // Update existing user
        const result = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            authUserId: user.id,
            email: user.email,
            name,
            emailVerified: new Date(),
            isAdmin,
            isModerator,
            isServiceAccount,
          },
        });
        console.log(`✓ Updated user: ${result.email} (${role})`);
      } else {
        // Create new user
        const result = await prisma.user.create({
          data: {
            authUserId: user.id,
            email: user.email,
            name,
            emailVerified: new Date(),
            isAdmin,
            isModerator,
            isServiceAccount,
          },
        });
        console.log(`✓ Created user: ${result.email} (${role})`);
      }
    } catch (error) {
      console.error(`✗ Failed to sync user ${user.email}:`, error);
    }
  }

  console.log("Database has been seeded. 🌱");
}

await main();
