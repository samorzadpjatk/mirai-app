import { env } from "./src/utils/env";
import { db } from "./src/index";
import { createSupabaseClient } from "@integral-2025-app/supabase";

const prisma = db;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client
const getAdminClient = () => {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("SERVICE_ROLE_KEY is required");
  }
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, undefined, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// User accounts to seed
const SEED_USERS = [
  {
    email: "admin@pjatk.dev",
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
  },
  {
    email: "dev@pjatk.dev",
    password: "dev123",
    role: "admin",
    firstName: "Developer",
    lastName: "User",
  },
  {
    email: "moderator@pjatk.dev",
    password: "moderator123",
    role: "moderator",
    firstName: "Moderator",
    lastName: "User",
  },
  {
    email: "user@pjatk.dev",
    password: "user123",
    role: "user",
    firstName: "Regular",
    lastName: "User",
  },
  {
    email: "student@pjatk.dev",
    password: "student123",
    role: "user",
    firstName: "Student",
    lastName: "User",
  },
  {
    email: "staff@pjatk.dev",
    password: "staff123",
    role: "user",
    firstName: "Staff",
    lastName: "User",
  },
  {
    email: "alice@pjatk.dev",
    password: "alice123",
    role: "user",
    firstName: "Alice",
    lastName: "Johnson",
  },
  {
    email: "bob@pjatk.dev",
    password: "bob123",
    role: "user",
    firstName: "Bob",
    lastName: "Smith",
  },
];

const findSupabaseUserIdByEmail = async (
  email: string,
): Promise<string | null> => {
  const supabase = getAdminClient();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error || !data) {
      console.error(`✗ Failed to list users while searching for ${email}:`, error?.message ?? error);
      return null;
    }

    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
};

async function createSupabaseUser(
  email: string,
  password: string,
  role: string,
  firstName: string,
  lastName: string,
): Promise<boolean> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
      },
      app_metadata: {
        role,
      },
    });

    if (error) {
      if (error.message.includes("has already been registered")) {
        const existingUserId = await findSupabaseUserIdByEmail(email);
        if (!existingUserId) {
          console.error(`✗ Could not locate existing auth user for ${email}`);
          return false;
        }

        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUserId);
        if (deleteError) {
          console.error(`✗ Failed to delete existing auth user ${email}:`, deleteError.message);
          return false;
        }

        console.log(`ℹ️ Deleted existing auth user: ${email}`);

        const { data: recreated, error: recreateError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            firstName,
            lastName,
          },
          app_metadata: {
            role,
          },
        });

        if (recreateError) {
          console.error(`✗ Failed to recreate ${email}:`, recreateError.message);
          return false;
        }

        if (recreated.user) {
          console.log(`✓ Recreated auth user: ${email} (${role})`);
          return true;
        }

        return false;
      }
      console.error(`✗ Failed to create ${email}:`, error.message);
      return false;
    }

    if (data.user) {
      console.log(`✓ Created auth user: ${email} (${role})`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Error creating ${email}:`, error);
    return false;
  }
}

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY environment variable",
    );
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  // Wait for Supabase to be ready
  console.log("Checking Supabase connection...");
  let retries = 10;
  while (retries > 0) {
    try {
      const supabase = getAdminClient();
      const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (!error) {
        console.log("✅ Supabase is ready");
        break;
      }
    } catch (error) {
      // Supabase not ready yet
    }
    retries--;
    if (retries > 0) {
      console.log(`Waiting for Supabase... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      console.error("❌ Supabase connection timeout");
      return;
    }
  }

  // Create users in Supabase Auth
  console.log("\n📝 Creating users in Supabase Auth...");
  for (const user of SEED_USERS) {
    await createSupabaseUser(
      user.email,
      user.password,
      user.role,
      user.firstName,
      user.lastName,
    );
  }

  console.log("\n📝 Fetching users from Supabase Auth...");

  // Fetch all users from Supabase Auth
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error || !data) {
    console.error(`Failed to fetch users:`, error);
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  const users = data.users ?? [];

  console.log(`✅ Found ${users.length} users in Supabase Auth\n`);

  type RoleValue = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";

  const mapRole = (role?: string | null): RoleValue => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "ADMIN";
      case "moderator":
        return "MODERATOR";
      case "service":
        return "SERVICE";
      default:
        return "USER";
    }
  };

  for (const user of users) {
    const rawRole =
      user.app_metadata?.role ?? user.user_metadata?.role ?? "user";
    const role = mapRole(rawRole);
    const firstName = user.user_metadata?.firstName ?? null;
    const lastName = user.user_metadata?.lastName ?? null;

    if (!firstName || !lastName) {
      console.warn(
        `  ⚠️ Skipping user ${user.email ?? user.id} - missing firstName/lastName metadata`,
      );
      continue;
    }

    try {
      const result = await prisma.user.updateMany({
        where: { authUserId: user.id },
        data: {
          firstName,
          lastName,
          role,
        },
      });

      if (result.count === 0) {
        console.warn(
          `  ⚠️ Missing DB user for ${user.email ?? user.id} - ensure auth trigger ran`,
        );
        continue;
      }

      console.log(`  ✓ Updated DB user: ${user.email ?? user.id} (${role})`);
    } catch (error) {
      console.error(`  ✗ Failed to sync user ${user.email ?? user.id}:`, error);
    }
  }

  console.log("\n🎿 Setting up Wintegral trip...");
  // --- Wintegral trip & location sharing setup --- 🔧
  try {
    const tripName = "Wintegral";
    let trip = await prisma.trip.findFirst({ where: { name: tripName } });

    if (!trip) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);

      trip = await prisma.trip.create({
        data: {
          name: tripName,
          description: "Wintegral Trip - Verbier, Switzerland",
          startDate,
          endDate,
        },
      });
      console.log(`✅ Created trip: ${trip.name} (${trip.id})`);
    } else {
      console.log(`ℹ️ Trip already exists: ${trip.name} (${trip.id})`);
    }

    // Ensure every user is a participant in the trip
    const dbUsers = await prisma.user.findMany();

    await Promise.all(
      dbUsers.map(async (u) => {
        try {
          const existingParticipant = await prisma.tripParticipant.findFirst({
            where: { userId: u.id, tripId: trip!.id },
          });
          if (!existingParticipant) {
            await prisma.tripParticipant.create({
              data: { userId: u.id, tripId: trip!.id },
            });
          }
        } catch (err) {
          console.error(`✗ Failed to add ${u.id} to trip ${tripName}:`, err);
        }
      }),
    );

    console.log(`✅ Added players to trip: ${trip.name}`);

    // --- Example groups & challenges for Wintegral --- 🎯
    try {
      const organizerId = dbUsers[0]?.id;
      if (organizerId) {
        // Create groups if none exist for the trip
        const existingGroups = await prisma.group.findMany({ where: { tripId: trip.id } });
        let groups = existingGroups;

        // simple generator for group join codes
        const generateGroupCode = (name: string) =>
          `${name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;

        if (existingGroups.length === 0) {
          const groupNames = ["Team Alpha", "Team Beta"];
          groups = await Promise.all(
            groupNames.map((name) =>
              prisma.group.create({ data: { tripId: trip.id, name, organizerId, code: generateGroupCode(name) } }),
            ),
          );
          console.log(`✅ Created groups for trip ${trip.name}: ${groupNames.join(", ")}`);
        } else {
          console.log(`ℹ️ Groups already exist for trip ${trip.name}`);
        }

        // Assign participants to groups round-robin
        const participants = await prisma.tripParticipant.findMany({ where: { tripId: trip.id } });
        await Promise.all(
          participants.map((p, i) =>
            prisma.tripParticipant.update({ where: { id: p.id }, data: { groupId: groups[i % groups.length].id } }),
          ),
        );
        console.log(`✅ Assigned ${participants.length} participants to groups`);

        // Create example challenges
        const challengesData = [
          {
            name: "Ski King",
            description: "Most vertical meters",
            basePoints: 100,
            submissionType: "IMAGE" as const,
            scoringCategory: "SPEED" as const,
            status: "ACTIVE" as const,
          },
          {
            name: "Photo Hunt",
            description: "Find and photograph 5 landmarks",
            basePoints: 50,
            submissionType: "MULTI_IMAGE" as const,
            scoringCategory: "JUDGED_STAFF" as const,
            status: "ACTIVE" as const,
          },
          {
            name: "Après Master",
            description: "Complete social check-ins",
            basePoints: 30,
            submissionType: "IMAGE_LOCATION" as const,
            scoringCategory: "UNLIMITED" as const,
            status: "ACTIVE" as const,
          },
        ];

        for (const ch of challengesData) {
          const existingChallenge = await prisma.challenge.findFirst({
            where: { tripId: trip.id, name: ch.name },
          });
          if (!existingChallenge) {
            await prisma.challenge.create({
              data: {
                tripId: trip.id,
                name: ch.name,
                description: ch.description,
                basePoints: ch.basePoints,
                submissionType: ch.submissionType,
                scoringCategory: ch.scoringCategory,
                status: ch.status,
              },
            });
            console.log(`✅ Created challenge: ${ch.name}`);
          } else {
            console.log(`ℹ️ Challenge already exists: ${ch.name}`);
          }
        }
      } else {
        console.log("⚠️ No users available to create groups/challenges");
      }
    } catch (err) {
      console.error("✗ Failed to create example groups/challenges:", err);
    }

    // Place everyone around Verbier (spread within 2 km) and enable location sharing between all users
    const verbierLat = 46.0966;
    const verbierLon = 7.2269;
    const spreadMeters = 2000; // 2 km radius
    const latFactor = 111000; // meters per degree latitude approx
    const cosLat = Math.cos((verbierLat * Math.PI) / 180);

    await Promise.all(
      dbUsers.map(async (u) => {
        const shareWith = dbUsers
          .filter((x) => x.id !== u.id)
          .map((x) => ({ id: x.id }));

        // Randomize location within a 2km radius (uniform distribution over area)
        const angle = Math.random() * 2 * Math.PI;
        const radius = spreadMeters * Math.sqrt(Math.random());
        const deltaNorth = radius * Math.cos(angle);
        const deltaEast = radius * Math.sin(angle);
        const latitude = verbierLat + deltaNorth / latFactor;
        const longitude = verbierLon + deltaEast / (latFactor * cosLat);

        const existingLocation = await prisma.location.findUnique({
          where: { userId: u.id },
        });

        if (existingLocation) {
          await prisma.location.update({
            where: { userId: u.id },
            data: {
              isSharingLocation: true,
              latitude,
              longitude,
              accuracy: Math.random() * 30 + 5, // random accuracy between 5-35m
              timestamp: new Date(),
              usersToShareWith: { set: shareWith },
            },
          });
        } else {
          await prisma.location.create({
            data: {
              userId: u.id,
              isSharingLocation: true,
              latitude,
              longitude,
              accuracy: Math.random() * 30 + 5,
              timestamp: new Date(),
              usersToShareWith: { connect: shareWith },
            },
          });
        }
      }),
    );

    console.log("✅ Location sharing enabled for all users at Verbier, Switzerland");
  } catch (err) {
    console.error("✗ Failed to setup Wintegral trip / locations:", err);
  }

  console.log("\n🎉 Database seeding completed successfully! 🌱");
  console.log("\n📋 Summary:");
  console.log(`   - Created ${SEED_USERS.length} auth users with various roles`);
  console.log("   - All users assigned to Wintegral trip");
  console.log("   - Location sharing enabled between all users");
  console.log("   - Groups and challenges set up");
  console.log("\n🔐 Login credentials:");
  SEED_USERS.forEach((u) => {
    console.log(`   ${u.email} / ${u.password} (${u.role})`);
  });
}

await main();
