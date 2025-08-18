import { Button, Flex, Avatar, Container, Strong, Separator } from "@radix-ui/themes";
import Link from "next/link";

import { auth } from "~/server/auth";
import NavMenu from "~/app/_components/nav_menu";

const TopBar = async () => {
    const session = await auth();
    return <Container>
        <Flex direction="row" align="center" justify={"between"}>
        <NavMenu />
        <Flex align="center" gap="2">
            {session?.user && <><Avatar fallback={session.user.name?.split(' ').map(name => name[0]).join('') ?? ""} src={session.user.image ?? undefined} /><Strong>{session.user.name}</Strong><Separator orientation="vertical" /></>}
            <Button><Link href={session?.user ? '/api/auth/signout' : '/api/auth/signin'}>{session?.user ? 'Wyloguj się' : 'Zaloguj się'}</Link></Button>
        </Flex>
    </Flex>
    </Container>;
}

export default TopBar;