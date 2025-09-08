import { Card, Flex, Heading, Separator } from "@radix-ui/themes";
import NavGrid from "./NavGrid";

// Component for authenticated users - the main dashboard
const AuthenticatedDashboard = () => {
    return (
        <Card>
            <Flex gap={{ initial: "3", md: "4" }} direction="column" align="center" justify="center">
                <Heading size={{ initial: "4", md: "5", lg: "6" }} style={{ fontFamily: "Roboto Slab" }}>Welcome to the Treasure Bank!</Heading>
                <Separator orientation="horizontal" size={{ initial: "2", md: "3", lg: "4" }} />
                <NavGrid />
            </Flex>
        </Card>
    );
}

export default AuthenticatedDashboard;