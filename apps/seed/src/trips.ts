import { createAuthUserByEmail, ensureGhostAuthUser } from "./auth";
import { prisma } from "./config/db";
import { supabase } from "./config/supabase";
import { env } from "./config/env";
import type { TripConfig, AuthUserByEmail } from "./types";
import { parseUsersCsv } from "./users";
import { joinPath } from "./utils/path";
import { readTextFile, readFile } from "./utils/fs";
import { normalizePath, relativePath } from "./utils/path";

export const seedTrip = async (
  tripConfig: TripConfig,
  usersCsvPath: string,
  envRoot: string,
  authUsers: AuthUserByEmail,
) => {
  const usersCsv = await readTextFile(joinPath(envRoot, usersCsvPath));
  const users = parseUsersCsv(usersCsv);

  // Handle background image upload if specified
  let backgroundImagePath: string | undefined;
  if (tripConfig.background) {
    const backgroundAbsPath = joinPath(envRoot, tripConfig.background);
    try {
      const backgroundFile = readFile(backgroundAbsPath);
      const { size } = await backgroundFile.stat();
      
      if (size > 0) {
        // Generate storage path: trips/{trip-key}/background.{ext}
        const ext = tripConfig.background.split('.').pop()?.toLowerCase() || 'jpg';
        const storagePath = `trips/${tripConfig.key}/background.${ext}`;
        
        const { error } = await supabase.storage
          .from(env.imageBucket)
          .upload(storagePath, backgroundFile, {
            upsert: true,
            contentType: `image/${ext}`,
          });
          
        if (error) {
          console.warn(`✗ Background upload failed for ${tripConfig.name}: ${error.message}`);
        } else {
          backgroundImagePath = storagePath;
          console.log(`✓ Uploaded background for ${tripConfig.name}: ${storagePath}`);
        }
      }
    } catch (err) {
      console.warn(`✗ Failed to read background image ${tripConfig.background} for ${tripConfig.name}:`, err);
    }
  }

  let trip = await prisma.trip.findFirst({ where: { name: tripConfig.name } });
  if (trip) {
    trip = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        description: tripConfig.description,
        startDate: new Date(tripConfig.startDate),
        endDate: new Date(tripConfig.endDate),
        backgroundImagePath,
      },
    });
  } else {
    trip = await prisma.trip.create({
      data: {
        name: tripConfig.name,
        description: tripConfig.description,
        startDate: new Date(tripConfig.startDate),
        endDate: new Date(tripConfig.endDate),
        backgroundImagePath,
      },
    });
  }

  for (const row of users) {
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
        console.warn(`✗ Supabase Auth user not found/created for ${email}, skipping DB user/participant.`);
        continue;
      }
      authUsers.set(email.toLowerCase(), authUser);
    }

    let dbUser = await prisma.user.findFirst({ where: { authUserId: authUser.id } });
    
    // Create the DB user manually if it doesn't exist
    if (!dbUser) {
      console.warn(`✗ DB user not yet created for ${email} (auth id ${authUser.id}). Creating manually...`);
      
      const roleMapping: Record<string, any> = {
        'admin': 'ADMIN',
        'moderator': 'MODERATOR', 
        'service': 'SERVICE',
        'user': 'USER'
      };
      
      const dbRole = roleMapping[row.role?.toLowerCase() || 'user'] || 'USER';
      
      try {
        dbUser = await prisma.user.create({
          data: {
            authUserId: authUser.id,
            firstName: row.firstName ?? "",
            lastName: row.lastName ?? "",
            role: dbRole,
          },
        });
        console.log(`✓ Manually created DB user for ${email} with role: ${dbRole}`);
      } catch (error) {
        console.warn(`✗ Failed to create DB user manually for ${email}:`, error);
        continue;
      }
    } else {
      // Update the role if it doesn't match what we expect from CSV
      const roleMapping: Record<string, any> = {
        'admin': 'ADMIN',
        'moderator': 'MODERATOR', 
        'service': 'SERVICE',
        'user': 'USER'
      };
      
      const expectedRole = roleMapping[row.role?.toLowerCase() || 'user'] || 'USER';
      
      if (dbUser.role !== expectedRole) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: expectedRole },
        });
      }
    }

    await prisma.tripParticipant.upsert({
      where: { userId_tripId: { userId: dbUser.id, tripId: trip.id } },
      update: {},
      create: {
        userId: dbUser.id,
        tripId: trip.id,
      },
    });
  }

  const ghostAuth = await ensureGhostAuthUser(authUsers);
  if (ghostAuth) {
    const ghostUser = await prisma.user.findFirst({ where: { authUserId: ghostAuth.id } });
    if (!ghostUser) {
      console.warn(`✗ Ghost DB user missing for auth id ${ghostAuth.id}. Ensure trigger ran.`);
      return;
    }

    await prisma.tripParticipant.upsert({
      where: { userId_tripId: { userId: ghostUser.id, tripId: trip.id } },
      update: {},
      create: {
        userId: ghostUser.id,
        tripId: trip.id,
      },
    });
  }

  console.log(`Trip seeded: ${trip.name} (${users.length} participants)`);
};
