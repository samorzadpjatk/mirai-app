import { Button, Flex, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { auth } from "~/server/auth";

async function NavGridContent() {
  const session = await auth();

  return (
    <Flex direction="column" gap="2">
      {session?.user && (
        <>
          <Grid
            columns={"1"}
            gap={"2"}
            rows={"repeat(2, 1fr)"}
            width={"auto"}
            style={{ fontFamily: "var(--font-robotoslab)" }}
          >
            <Button variant="outline">
              <Link href={"/group/my"}>
                <Text>Twoja grupa</Text>
              </Link>
            </Button>
            <Button variant="outline">
              <Link href={"/ranking"}>
                <Text>Ranking grup</Text>
              </Link>
            </Button>
          </Grid>
          {session?.user.isAdmin && (
            <Button variant="outline">
              <Link href={"/admin/groups"}>
                <Text>Panel administracyjny</Text>
              </Link>
            </Button>
          )}
        </>
      )}
    </Flex>
  );
}

export default function NavGrid() {
  return (
    <ErrorBoundary fallback={<div>Coś poszło nie tak!</div>}>
      <Suspense fallback={<div>Ładowanie...</div>}>
        <NavGridContent />
      </Suspense>
    </ErrorBoundary>
  );
}