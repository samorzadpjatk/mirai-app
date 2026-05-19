import { createAuthUserByEmail, ensureGhostAuthUser } from "./auth";
import { db } from "./config/db";
import { supabase } from "./config/supabase";
import { env } from "./config/env";
import { cleanupTripBackground } from "./storage";
import type { TripConfig, AuthUserByEmail } from "./types";
import { parseUsersCsv } from "./users";
import { joinPath } from "./utils/path";
import { readTextFile, readFile } from "./utils/fs";
import type { Role } from "@mirai-app/db";
import { trips, users, tripParticipants } from "@mirai-app/db";
import { eq } from "drizzle-orm";

export const seedTrip = async (
  tripConfig: TripConfig,
  usersCsvPath: string,
  envRoot: string,
  authUsers: AuthUserByEmail,
) => {
  const usersCsv = await readTextFile(joinPath(envRoot, usersCsvPath));
  const csvUsers = parseUsersCsv(usersCsv);

  let backgroundImagePath: string | undefined;
  if (tripConfig.background) {
    const backgroundAbsPath = joinPath(envRoot, tripConfig.background);
    try {
      const backgroundFile: BunFile = readFile(backgroundAbsPath);
      const fileStat = await backgroundFile.stat();
      const size: number = fileStat.size;

      if (size > 0) {
        const ext = tripConfig.background.split(".").pop()?.toLowerCase() ?? "jpg";
        const storagePath = `trips/${tripConfig.key}/background.${ext}`;

        await cleanupTripBackground(tripConfig.key);

        const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

        const uploadResult = await supabase.storage
          .from(env.imageBucket)
          .upload(storagePath, backgroundFile, {
            upsert: true,
            contentType: mimeType,
          });

        if (uploadResult.error) {
          console.warn(
            `✗ Background upload failed for ${tripConfig.name}: ${uploadResult.error.message}`,
          );
        } else {
          backgroundImagePath = storagePath;
          console.log(`✓ Uploaded background for ${tripConfig.name}: ${storagePath}`);
        }
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `✗ Failed to read background image ${tripConfig.background} for ${tripConfig.name}:`,
        error,
      );
    }
  }

  let trip = await db.query.trips.findFirst({ where: (t, { eq }) => eq(t.name, tripConfig.name) });
  if (trip) {
    await db
      .update(trips)
      .set({
        description: tripConfig.description,
        startDate: new Date(tripConfig.startDate),
        endDate: new Date(tripConfig.endDate),
        backgroundImagePath,
      })
      .where(eq(trips.id, trip.id));
    trip = await db.query.trips.findFirst({ where: (t, { eq }) => eq(t.id, trip!.id) });
  } else {
    const inserted = await db
      .insert(trips)
      .values({
        name: tripConfig.name,
        description: tripConfig.description,
        startDate: new Date(tripConfig.startDate),
        endDate: new Date(tripConfig.endDate),
        backgroundImagePath,
      })
      .returning();
    trip = inserted[0];
  }

  if (!trip) {
    throw new Error(`Failed to create or update trip: ${tripConfig.name}`);
  }

  for (const row of csvUsers) {
    const email = row.email?.trim();
    if (!email) continue;

    let authUser = authUsers.get(email.toLowerCase()) ?? null;
    if (!authUser) {
      authUser = await createAuthUserByEmail(
        email,
        row.firstName ?? "",
        row.lastName ?? "",
        row.role ?? "user",
      );
      if (!authUser) {
        console.warn(
          `✗ Supabase Auth user not found/created for ${email}, skipping DB user/participant.`,
        );
        continue;
      }
      authUsers.set(email.toLowerCase(), authUser);
    }

    let dbUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.authUserId, authUser.id),
    });

    if (!dbUser) {
      console.warn(
        `✗ DB user not yet created for ${email} (auth id ${authUser.id}). Creating manually...`,
      );

      const roleMapping: Record<string, string> = {
        admin: "ADMIN",
        moderator: "MODERATOR",
        service: "SERVICE",
        user: "USER",
      };

      const dbRole = (roleMapping[row.role?.toLowerCase() ?? "user"] ?? "USER") as Role;

      try {
        const inserted = await db
          .insert(users)
          .values({
            authUserId: authUser.id,
            firstName: row.firstName ?? "",
            lastName: row.lastName ?? "",
            role: dbRole,
          })
          .returning();
        dbUser = inserted[0];
        console.log(`✓ Manually created DB user for ${email} with role: ${dbRole}`);
      } catch (error) {
        console.warn(`✗ Failed to create DB user manually for ${email}:`, error);
        continue;
      }
    } else {
      const roleMapping: Record<string, string> = {
        admin: "ADMIN",
        moderator: "MODERATOR",
        service: "SERVICE",
        user: "USER",
      };

      const expectedRole = (roleMapping[row.role?.toLowerCase() ?? "user"] ?? "USER") as Role;

      if (dbUser.role !== expectedRole) {
        const dbUserId = dbUser.id;
        await db.update(users).set({ role: expectedRole }).where(eq(users.id, dbUserId));
        dbUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, dbUserId) });
      }
    }

    if (!dbUser) {
      console.warn(`✗ DB user missing for ${email}, skipping participant.`);
      continue;
    }

    await db
      .insert(tripParticipants)
      .values({
        userId: dbUser.id,
        tripId: trip.id,
      })
      .onConflictDoNothing();
  }

  const ghostAuth = await ensureGhostAuthUser(authUsers);
  if (ghostAuth) {
    let ghostUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.authUserId, ghostAuth.id),
    });
    if (!ghostUser) {
      console.warn(`✗ Ghost DB user missing for auth id ${ghostAuth.id}. Creating manually...`);
      try {
        const inserted = await db
          .insert(users)
          .values({
            authUserId: ghostAuth.id,
            firstName: "Ghost",
            lastName: "User",
            role: "USER",
          })
          .returning();
        ghostUser = inserted[0];
        console.log(`✓ Manually created ghost DB user`);
      } catch (error) {
        console.warn(`✗ Failed to create ghost DB user manually:`, error);
        return trip;
      }
    }

    if (ghostUser) {
      await db
        .insert(tripParticipants)
        .values({
          userId: ghostUser.id,
          tripId: trip.id,
        })
        .onConflictDoNothing();
    }
  }

  console.log(`Trip seeded: ${trip.name} (${csvUsers.length} participants)`);
  return trip;
};
