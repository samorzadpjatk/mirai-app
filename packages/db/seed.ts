import {
  createSupabaseClient,
  type SupabaseClient,
  type SupabaseUser as SupabaseAuthUser,
} from "@integral-2025-app/supabase";

import { env } from "./src/utils/env";
import { db } from "./src/index";

interface SeedAuthUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

type UserMetadata = {
  name?: string;
  role?: string;
};

type AppMetadata = {
  role?: string;
};

const prisma = db;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const seedAuthUsers: SeedAuthUser[] = [
  {
    email: "admin@pjatk.dev",
    password: "admin123",
    role: "admin",
    name: "Admin User",
  },
  {
    email: "tech@pjatk.dev",
    password: "tech123",
    role: "tech",
    name: "Developer User",
  },
  {
    email: "moderator@pjatk.dev",
    password: "moderator123",
    role: "moderator",
    name: "Moderator User",
  },
  {
    email: "service@pjatk.dev",
    password: "service123",
    role: "service",
    name: "Service Bot",
  },
  {
    email: "user@pjatk.dev",
    password: "user123",
    role: "user",
    name: "Regular User",
  },
  {
    email: "student@pjatk.dev",
    password: "student123",
    role: "user",
    name: "Student User",
  },
];

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getUserMetadata = (user: SupabaseAuthUser): UserMetadata => {
  const metadata = user.user_metadata;
  if (metadata && typeof metadata === "object") {
    return metadata as UserMetadata;
  }
  return {};
};

const getAppMetadata = (user: SupabaseAuthUser): AppMetadata => {
  const metadata = user.app_metadata;
  if (metadata && typeof metadata === "object") {
    return metadata as AppMetadata;
  }
  return {};
};

const waitForSupabase = async (supabase: SupabaseClient) => {
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (!error) {
      return;
    }

    if (attempt === maxAttempts) {
      throw new Error(error.message);
    }

    await sleep(1000);
  }

  throw new Error("Supabase auth API not reachable");
};

const fetchSupabaseUsers = async (
  supabase: SupabaseClient,
): Promise<SupabaseAuthUser[]> => {
  const users: SupabaseAuthUser[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const pageUsers = data?.users ?? [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
};

const createSupabaseUser = async (
  supabase: SupabaseClient,
  user: SeedAuthUser,
): Promise<SupabaseAuthUser | null> => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      name: user.name,
      role: user.role,
    },
    app_metadata: {
      role: user.role,
    },
  });

  if (!error) {
    return data?.user ?? null;
  }

  const errorText = error.message.toLowerCase();
  const alreadyRegistered =
    errorText.includes("already registered") ||
    errorText.includes("already exists") ||
    errorText.includes("duplicate key");

  if (alreadyRegistered) {
    console.log(`ℹ️ Auth user already exists: ${user.email}`);
    return null;
  }

  console.error(`✗ Failed to create auth user ${user.email}: ${error.message}`);
  return null;
};

const waitForDbUsers = async (emails: string[]) => {
  if (emails.length === 0) return [];

  const maxAttempts = 20;
  const normalizedEmails = emails.map((email) => email.toLowerCase());

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: normalizedEmails,
          mode: "insensitive",
        },
      },
    });

    if (users.length >= normalizedEmails.length) {
      return users;
    }

    await sleep(500);
  }

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: normalizedEmails,
        mode: "insensitive",
      },
    },
  });

  if (users.length < normalizedEmails.length) {
    console.log(
      `⚠️ Only ${users.length}/${normalizedEmails.length} seeded users found in DB. Proceeding with available users.`,
    );
  }

  return users;
};

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY environment variable",
    );
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, undefined, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  try {
    console.log("Waiting for Supabase Auth...");
    await waitForSupabase(supabase);
  } catch (error) {
    console.error("Failed to connect to Supabase Auth:", error);
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  console.log("Ensuring seed users exist in Supabase Auth...");

  let existingUsers: SupabaseAuthUser[] = [];

  try {
    existingUsers = await fetchSupabaseUsers(supabase);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  const existingUsersByEmail = new Map(
    existingUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  );

  for (const seedUser of seedAuthUsers) {
    const emailKey = seedUser.email.toLowerCase();
    if (existingUsersByEmail.has(emailKey)) {
      console.log(`ℹ️ Auth user already exists: ${seedUser.email}`);
      continue;
    }

    const created = await createSupabaseUser(supabase, seedUser);
    if (created?.email) {
      existingUsersByEmail.set(created.email.toLowerCase(), created);
      console.log(`✓ Created auth user: ${created.email} (${seedUser.role})`);
    }
  }

  console.log("Fetching users from Supabase Auth...");

  let users: SupabaseAuthUser[] = [];

  try {
    users = await fetchSupabaseUsers(supabase);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    console.log("Skipping auth users sync...");
    console.log("Database seeding completed. 🌱");
    return;
  }

  console.log(`Found ${users.length} users in Supabase Auth`);

  const seededEmails = seedAuthUsers.map((seedUser) => seedUser.email);
  const seededDbUsers = await waitForDbUsers(seededEmails);
  if (seededDbUsers.length > 0) {
    console.log(`✓ Found ${seededDbUsers.length} seeded users in DB`);
  }

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
          console.error(`✗ Failed to add ${u.email} to trip ${tripName}:`, err);
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

  console.log("Database has been seeded. 🌱");
}

await main();
