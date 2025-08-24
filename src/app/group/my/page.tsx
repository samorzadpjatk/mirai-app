import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
const MyGroupPage = async ({
    children,
}: Readonly<{ children: React.ReactNode }>) => {
    const session = await auth();
    if (!session?.user) {
        return null;
    }

    return (<HydrateClient>{children}</HydrateClient>);
}

export default MyGroupPage;