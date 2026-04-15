import { useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "urql";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { CreateDownloadUrlDocument } from "@mirai-app/graphql-client";

interface GroupMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  isLeader: boolean;
  avatarStoragePath?: string | null;
}

interface GroupMemberListProps {
  members: GroupMember[];
}

function MemberAvatar({ member }: { member: GroupMember }) {
  const [result] = useQuery({
    query: CreateDownloadUrlDocument,
    variables: {
      input: {
        storagePath: member.avatarStoragePath,
        expiresInSeconds: 60 * 60,
      },
    },
    pause: !member.avatarStoragePath,
  });

  const { data, fetching } = result;
  const signedUrl = data?.createDownloadUrl?.signedUrl ?? null;

  if (fetching) {
    return (
      <YStack
        width="100%"
        height="100%"
        borderRadius="$full"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={12} fontWeight="bold" color="white">
          ...
        </Text>
      </YStack>
    );
  }

  if (signedUrl) {
    return (
      <Image
        source={{ uri: signedUrl }}
        style={{ width: "100%", height: "100%", borderRadius: 9999 }}
        contentFit="cover"
      />
    );
  }

  return (
    <Text fontSize={12} fontWeight="bold" color="white">
      {member.initials}
    </Text>
  );
}

export function GroupMemberList({ members }: GroupMemberListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreThanPreview = members.length > 3;
  const visibleMembers = useMemo(
    () => (isExpanded ? members : members.slice(0, 3)),
    [isExpanded, members],
  );

  return (
    <YStack marginBottom="$4">
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$1"
        marginBottom="$3"
      >
        <Text
          fontSize="$sm"
          fontWeight="bold"
          color="rgba(148, 163, 184, 1)"
          textTransform="uppercase"
          letterSpacing={1.5}
        >
          Member Directory
        </Text>
        {hasMoreThanPreview ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsExpanded((prev) => !prev)}
          >
            <Text fontSize={12} fontWeight="bold" color="rgba(0, 206, 209, 1)">
              {isExpanded ? "Show Less" : "View All"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </XStack>

      <YStack gap="$2">
        {visibleMembers.map((member) => (
          <YStack
            key={member.id}
            backgroundColor="rgba(39, 41, 53, 0.5)"
            borderWidth={1}
            borderColor="rgba(255, 255, 255, 0.05)"
            borderRadius="$5"
            padding="$3"
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                width={40}
                height={40}
                borderRadius="$full"
                overflow="hidden"
                backgroundColor="rgba(148, 163, 184, 1)"
                borderWidth={2}
                borderColor={
                  member.isLeader ? "rgba(0, 206, 209, 1)" : "transparent"
                }
                alignItems="center"
                justifyContent="center"
              >
                <MemberAvatar member={member} />
              </YStack>
              <YStack flex={1}>
                <Text
                  fontSize="$sm"
                  fontWeight="bold"
                  color="white"
                  marginBottom={2}
                >
                  {member.name}
                </Text>
                <Text
                  fontSize={10}
                  fontWeight="bold"
                  color={
                    member.isLeader
                      ? "rgba(0, 206, 209, 1)"
                      : "rgba(148, 163, 184, 1)"
                  }
                  textTransform="uppercase"
                  letterSpacing={-0.2}
                >
                  {member.role.toUpperCase()}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        ))}
      </YStack>
    </YStack>
  );
}
