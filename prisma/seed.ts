import { PrismaClient } from "@prisma/client";

type AuthentikResponse = {
  results: {
    id: string;
    name: string;
    users_obj: {
      id: string;
      email: string;
      name: string;
    }[];
  }[];
};

const prisma = new PrismaClient();

const AUTHENTIK_SERVICE_ACCOUNT_TOKEN =
  process.env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;
const AUTHENTIK_API_SEARCH_URL = new URL(
  "/api/v3/core/groups/",
  "https://auth.samorzad.pja.edu.pl",
);
AUTHENTIK_API_SEARCH_URL.searchParams.append("search", "Integral 2025");

async function main() {
  if (!AUTHENTIK_SERVICE_ACCOUNT_TOKEN) {
    throw new Error("Missing AUTHENTIK_SERVICE_ACCOUNT_TOKEN");
  }

  // Request data from auth system
  const response = await fetch(AUTHENTIK_API_SEARCH_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${AUTHENTIK_SERVICE_ACCOUNT_TOKEN}`,
    },
  });

  const data: AuthentikResponse | undefined = (await response.json()) as
    | AuthentikResponse
    | undefined;
  const groupResults = data?.results ?? [];
  for (const group of groupResults) {
    for (const user of group.users_obj) {
      // Upsert the information of each user in groups related to the trip into the database
      const result = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          emailVerified: new Date(),
          isAdmin: group.name === process.env.ADMIN_ROLE || group.name === process.env.TECH_ROLE,
          isModerator: group.name === process.env.KADRA_ROLE,
          isServiceAccount: group.name === process.env.SERVICE_ACCOUNT_ROLE,
        },
        create: {
          email: user.email,
          name: user.name,
          emailVerified: new Date(),
          isAdmin: group.name === process.env.ADMIN_ROLE || group.name === process.env.TECH_ROLE,
          isModerator: group.name === process.env.KADRA_ROLE,
          isServiceAccount: group.name === process.env.SERVICE_ACCOUNT_ROLE,
          // securityCode:
        },
      });
      console.log(`Upserted user: ${result.email} (${group.name})`);
    }
  }
  console.log("Database has been seeded. 🌱");
}

await main();
