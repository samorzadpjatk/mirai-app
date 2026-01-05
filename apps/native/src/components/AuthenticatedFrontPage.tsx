import { Card, YStack, H2, Separator } from "tamagui";
import NavGrid from "./NavGrid";

interface AuthenticatedFrontPageProps {
  isAdmin?: boolean;
  isModerator?: boolean;
  onNavigate: (path: string) => void;
}

const AuthenticatedFrontPage = ({ isAdmin, isModerator, onNavigate }: AuthenticatedFrontPageProps) => {
    return (
        <Card elevate bordered p="$6">
            <YStack gap="$4" items="center" justify="center">
                <H2 fontFamily="$heading">Welcome to the Treasure Bank!</H2>
                <Separator />
                <NavGrid isAdmin={isAdmin} isModerator={isModerator} onNavigate={onNavigate} />
            </YStack>
        </Card>
    );
}

export default AuthenticatedFrontPage;