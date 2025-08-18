import { TabNav } from "@radix-ui/themes";
import Link from "next/link";
import { auth } from "~/server/auth";

const NavMenu = async () => {
    const session = await auth();
    
    // If user is not authenticated, show minimal navigation or none
    if (!session?.user) {
        return (
            <TabNav.Root>
                <TabNav.Link asChild className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}>
                    <Link href={"/"}>🏰 Bank Monet</Link>
                </TabNav.Link>
            </TabNav.Root>
        );
    }

    // Full navigation for authenticated users
    return (
        <TabNav.Root>
            <TabNav.Link asChild className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}>
                <Link href={"/"}>Strona główna</Link>
            </TabNav.Link>
            <TabNav.Link asChild className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}>
                <Link href={"/ranking"}>Ranking grup</Link>
            </TabNav.Link>
            <TabNav.Link asChild className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}>
                <Link href={"/group/create"}>Utwórz grupę</Link>
            </TabNav.Link>
            <TabNav.Link asChild className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}>
                <Link href={"/group/join"}>Dołącz do grupy</Link>
            </TabNav.Link>
            <TabNav.Link asChild className="hover:underline" style={{ fontFamily: 'var(--font-robotoslab)' }}>
                <Link href={"/admin"}>Panel admina</Link>
            </TabNav.Link>
        </TabNav.Root>
    );
}
export default NavMenu;