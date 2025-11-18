import { env } from "../src/env"
import { prisma } from "../src/index"

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

const AUTHENTIK_SERVICE_ACCOUNT_TOKEN =
  env.AUTHENTIK_SERVICE_ACCOUNT_TOKEN;
const AUTHENTIK_API_SEARCH_URL = new URL(
  "/api/v3/core/groups/",
  env.AUTHENTIK_ISSUER,
);
AUTHENTIK_API_SEARCH_URL.searchParams.append("search", "PJAPP");

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
  console.log(`Found ${groupResults.length} groups`);
  for (const group of groupResults) {
    for (const user of group.users_obj) {
      // Upsert the information of each user in groups related to the trip into the database
      const result = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          emailVerified: new Date(),
          isAdmin: group.name === env.ADMIN_ROLE || group.name === env.TECH_ROLE,
          isModerator: group.name === env.MODERATOR_ROLE,
          isServiceAccount: group.name === env.SERVICE_ACCOUNT_ROLE,
        },
        create: {
          email: user.email,
          name: user.name,
          emailVerified: new Date(),
          isAdmin: group.name === env.ADMIN_ROLE || group.name === env.TECH_ROLE,
          isModerator: group.name === env.MODERATOR_ROLE,
          isServiceAccount: group.name === env.SERVICE_ACCOUNT_ROLE,
        },
      });
      console.log(`Upserted user: ${result.email} (${group.name})`);
    }
  }
  console.log("Database has been seeded. 🌱");
}

await main();
