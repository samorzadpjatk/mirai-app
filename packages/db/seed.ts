import { env } from "./src/utils/env";
import { db } from "./src/index";

interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    role?: string;
  };
  app_metadata: {
    role?: string;
  };
}

interface SupabaseUsersResponse {
  users: SupabaseUser[];
}

const prisma = db;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:8000";
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

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

  const data: SupabaseUsersResponse = await response.json(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
  const users = data.users ?? [];

  console.log(`Found ${users.length} users in Supabase Auth`);

  type RoleValue = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";

  const parseName = (
    fullName?: string | null,
  ): { firstName?: string; lastName?: string } => {
    if (!fullName?.trim()) return {};
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0] };
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  };

  const mapRole = (role?: string | null): RoleValue => {
    switch (role?.toLowerCase()) {
      case "admin":
      case "tech":
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
    const { firstName, lastName } = parseName(
      user.user_metadata?.name ?? user.email.split("@")[0],
    );

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
            firstName,
            lastName,
            emailVerified: new Date(),
            role,
          },
        });
        console.log(`✓ Updated user: ${result.email} (${role})`);
      } else {
        // Create new user
        const result = await prisma.user.create({
          data: {
            authUserId: user.id,
            email: user.email,
            firstName,
            lastName,
            emailVerified: new Date(),
            role,
          },
        });
        console.log(`✓ Created user: ${result.email} (${role})`);
      }
    } catch (error) {
      console.error(`✗ Failed to sync user ${user.email}:`, error);
    }
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

        // Create example challenges and link to groups
        const challengesData = [
          { name: "Ski King", description: "Most vertical meters", points: 100 },
          { name: "Photo Hunt", description: "Find and photograph 5 landmarks", points: 50 },
          { name: "Après Master", description: "Complete social check-ins", points: 30 },
        ];

        for (const ch of challengesData) {
          let challenge = await prisma.challenge.findFirst({ where: { tripId: trip.id, name: ch.name } });
          if (!challenge) {
            challenge = await prisma.challenge.create({ data: { tripId: trip.id, name: ch.name, description: ch.description, points: ch.points } });
            console.log(`✅ Created challenge: ${challenge.name}`);
          } else {
            console.log(`ℹ️ Challenge already exists: ${challenge.name}`);
          }

          // Link challenge to all groups
          for (const g of groups) {
            const exists = await prisma.challengeGroup.findFirst({ where: { challengeId: challenge.id, groupId: g.id } });
            if (!exists) {
              await prisma.challengeGroup.create({ data: { challengeId: challenge.id, groupId: g.id } });
            }
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
