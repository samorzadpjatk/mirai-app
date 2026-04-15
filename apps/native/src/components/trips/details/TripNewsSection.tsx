import { useMemo } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useClient } from "urql";
import { useGetActivitiesByTripQuery } from "@mirai-app/graphql-client";
import { styled, Text, YStack, XStack, Card, Spinner } from "@mirai-app/ui";

interface TripNewsSectionProps {
  tripId: string;
}

interface AdminNewsItem {
  id: string;
  activityType: "custom";
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date | string;
  admin?: {
    firstName: string;
    lastName: string;
  } | null;
}

const formatRelativeTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes <= 30) return `${minutes}m ago`;

  const datePart = date.toLocaleDateString("pl-PL");
  const timePart = date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
};

const formatAdminName = (item: AdminNewsItem) => {
  const firstName = item.admin?.firstName?.trim();
  const lastName = item.admin?.lastName?.trim();
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full.length > 0 ? full : "Admin";
};

const NewsSection = styled(YStack, {
  name: "NewsSection",
  marginTop: "$xxl",
  marginBottom: "$xxl",
});

const NewsSectionHeader = styled(XStack, {
  name: "NewsSectionHeader",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: "$lg",
  marginBottom: "$md",
});

const SectionTitle = styled(Text, {
  name: "SectionTitle",
  fontSize: "$xs",
  fontWeight: "$bold",
  color: "$slate400",
  textTransform: "uppercase",
  letterSpacing: 2,
});

const ViewAllButton = styled(Card, {
  name: "ViewAllButton",
  paddingHorizontal: "$sm",
  paddingVertical: 4,
  backgroundColor: "transparent",
  borderWidth: 0,
});

const ViewAllButtonText = styled(Text, {
  name: "ViewAllButtonText",
  color: "$primary",
  fontSize: "$xs",
  fontWeight: "$bold",
  textTransform: "uppercase",
  letterSpacing: 1.2,
});

const NewsList = styled(YStack, {
  name: "NewsList",
  paddingHorizontal: "$lg",
  gap: "$md",
});

const LoadingState = styled(XStack, {
  name: "LoadingState",
  alignItems: "center",
  gap: "$sm",
  backgroundColor: "$cardDarkOpacity40",
  borderWidth: 1,
  borderColor: "$primaryOpacity10",
  padding: "$lg",
  borderRadius: "$md",
});

const LoadingText = styled(Text, {
  name: "LoadingText",
  color: "$textSecondary",
  fontSize: "$sm",
});

const EmptyState = styled(XStack, {
  name: "EmptyState",
  alignItems: "center",
  gap: "$sm",
  backgroundColor: "$cardDarkOpacity40",
  borderWidth: 1,
  borderColor: "$primaryOpacity10",
  padding: "$lg",
  borderRadius: "$md",
});

const EmptyText = styled(Text, {
  name: "EmptyText",
  color: "$textSecondary",
  fontSize: "$sm",
});

const NewsItem = styled(Card, {
  name: "NewsItem",
  backgroundColor: "$cardDarkOpacity40",
  borderWidth: 1,
  borderColor: "$primaryOpacity10",
  padding: "$lg",
  borderRadius: "$md",
  flexDirection: "row",
  gap: "$lg",
});

const NewsIcon = styled(YStack, {
  name: "NewsIcon",
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "$primaryOpacity20",
});

const NewsContent = styled(YStack, {
  name: "NewsContent",
  flex: 1,
});

const NewsHeader = styled(XStack, {
  name: "NewsHeader",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "$xs",
  gap: "$sm",
});

const NewsTitle = styled(Text, {
  name: "NewsTitle",
  fontSize: "$sm",
  fontWeight: "$bold",
  color: "$white",
  flex: 1,
});

const NewsTime = styled(Text, {
  name: "NewsTime",
  fontSize: "$xs",
  fontWeight: "$medium",
  color: "$slate500",
});

const NewsDescription = styled(Text, {
  name: "NewsDescription",
  fontSize: "$xs",
  color: "$textTertiary",
  lineHeight: 20,
});

const NewsAuthor = styled(Text, {
  name: "NewsAuthor",
  marginTop: "$sm",
  fontSize: "$xs",
  color: "$textSecondary",
});

const NewsImage = styled(Image, {
  name: "NewsImage",
  width: "100%",
  height: 120,
  borderRadius: "$sm",
  borderWidth: 1,
  borderColor: "$borderWhite10",
  marginTop: "$sm",
});

export function TripNewsSection({ tripId }: TripNewsSectionProps) {
  const router = useRouter();
  const client = useClient();
  // Client is always available when the component mounts, no need for effect
  const isClientReady = Boolean(client);

  const [newsResult] = useQuery({
    query: useGetActivitiesByTripQuery.document,
    variables: {
      tripId,
      page: 1,
      pageSize: 30,
    },
    pause: !Boolean(tripId) || !isClientReady,
  });

  const { data: newsData, fetching } = newsResult;

  const customNews = useMemo(() => {
    const activities = (newsData?.activities ?? []) as {
      id: string;
      activityType: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      createdAt: Date | string;
      admin?: {
        firstName: string;
        lastName: string;
      } | null;
    }[];

    return activities.filter(
      (activity): activity is AdminNewsItem =>
        activity.activityType === "custom",
    );
  }, [newsData?.activities]);

  return (
    <NewsSection>
      <NewsSectionHeader>
        <SectionTitle>Latest News</SectionTitle>
        <ViewAllButton
          onPress={() =>
            router.push({
              pathname: "/(tabs)/community",
              params: { filter: "news" },
            })
          }
        >
          <ViewAllButtonText>View all</ViewAllButtonText>
        </ViewAllButton>
      </NewsSectionHeader>

      <NewsList>
        {fetching ? (
          <LoadingState>
            <Spinner size="small" color="primary" />
            <LoadingText>Loading admin news...</LoadingText>
          </LoadingState>
        ) : null}

        {!fetching && customNews.length === 0 ? (
          <EmptyState>
            <Ionicons
              name="megaphone-outline"
              size={18}
              color="rgba(255, 255, 255, 0.4)"
            />
            <EmptyText>No news yet.</EmptyText>
          </EmptyState>
        ) : null}

        {customNews.map((item) => (
          <NewsItem
            key={item.id}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/community",
                params: {
                  filter: "news",
                  focusActivityId: item.id,
                },
              })
            }
            pressStyle={{ opacity: 0.9 }}
          >
            <NewsIcon>
              <Ionicons name="megaphone" size={18} color="#00CED1" />
            </NewsIcon>

            <NewsContent>
              <NewsHeader>
                <NewsTitle>{item.title}</NewsTitle>
                <NewsTime>{formatRelativeTime(item.createdAt)}</NewsTime>
              </NewsHeader>

              {item.description ? (
                <NewsDescription>{item.description}</NewsDescription>
              ) : null}

              {item.imageUrl ? (
                <NewsImage source={{ uri: item.imageUrl }} contentFit="cover" />
              ) : null}

              <NewsAuthor>Added by {formatAdminName(item)}</NewsAuthor>
            </NewsContent>
          </NewsItem>
        ))}
      </NewsList>
    </NewsSection>
  );
}
