import { useEffect } from "react";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Card, Text, XStack, YStack, Image } from "@mirai-app/ui";
import { Ionicons } from "@expo/vector-icons";
import { useFileDownload } from "~/hooks/files";

interface ExistingSubmission {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string | Date;
  imageIds: string[];
  rejectionReason?: string | null;
}

interface ExistingSubmissionCardProps {
  submission: ExistingSubmission;
  isWithdrawing: boolean;
  localPreviewUri?: string | null;
  onWithdraw: (submissionId: string) => Promise<void>;
}

const getStatusColor = (status: ExistingSubmission["status"]) => {
  if (status === "APPROVED") return "#22c55e";
  if (status === "REJECTED") return "#ef4444";
  return "#f59e0b";
};

const getStatusLabel = (status: ExistingSubmission["status"]) => {
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return "Pending Review";
};

const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

export function ExistingSubmissionCard({
  submission,
  isWithdrawing,
  localPreviewUri,
  onWithdraw,
}: ExistingSubmissionCardProps) {
  const hasImage = submission.imageIds.length > 0;
  const canWithdraw = submission.status !== "APPROVED";
  const {
    download,
    status: imageStatus,
    file,
    reset,
    abort,
  } = useFileDownload();

  useEffect(() => {
    if (!hasImage) {
      reset();
      return;
    }

    reset();
    void download({
      storagePath: submission.imageIds[0] ?? "",
    }).catch(() => {
      // Object might not be available yet right after submission creation.
      // Keep the card visible and show the fallback state instead of throwing.
    });

    return () => {
      abort();
    };
  }, [abort, download, hasImage, reset, submission.imageIds]);

  const handleWithdrawPress = () => {
    Alert.alert(
      "Withdraw submission",
      "Are you sure you want to withdraw this submission?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: () => {
            void onWithdraw(submission.id);
          },
        },
      ],
    );
  };

  return (
    <Card
      borderWidth={1}
      borderColor="rgba(0, 206, 209, 0.3)"
      marginBottom="$4"
      gap="$2"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$2">
        <Text variant="body" fontWeight="$bold" color="white">
          Submission sent
        </Text>
        <YStack
          borderWidth={1}
          borderRadius="$md"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderColor={getStatusColor(submission.status)}
        >
          <Text
            fontSize={10}
            fontWeight="$bold"
            textTransform="uppercase"
            letterSpacing={0.5}
            color={getStatusColor(submission.status)}
          >
            {getStatusLabel(submission.status)}
          </Text>
        </YStack>
      </XStack>

      <Text fontSize={13} color="muted">
        Submitted: {formatDateTime(submission.createdAt)}
      </Text>

      {hasImage && (
        <YStack
          width="100%"
          aspectRatio={4 / 3}
          borderRadius="$lg"
          overflow="hidden"
          backgroundColor="#272935"
        >
          {imageStatus === "loading" ? (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$1"
            >
              <ActivityIndicator size="small" color="#00ced1" />
            </YStack>
          ) : file?.uri ? (
            <Image
              source={{ uri: file.uri }}
              width="100%"
              height="100%"
              resizeMode="contain"
            />
          ) : localPreviewUri ? (
            <Image
              source={{ uri: localPreviewUri }}
              width="100%"
              height="100%"
              resizeMode="contain"
            />
          ) : (
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$1"
            >
              <Ionicons name="image-outline" size={24} color="#9ca3af" />
              <Text fontSize={10} color="muted">
                Image unavailable
              </Text>
            </YStack>
          )}
        </YStack>
      )}

      {!hasImage && (
        <XStack alignItems="center" gap="$1">
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#9ca3af"
          />
          <Text fontSize={10} color="muted">
            Submission has no image asset.
          </Text>
        </XStack>
      )}

      {submission.status === "REJECTED" && submission.rejectionReason && (
        <Text fontSize={13} color="#fca5a5">
          Rejection reason: {submission.rejectionReason}
        </Text>
      )}

      {canWithdraw ? (
        <TouchableOpacity
          onPress={handleWithdrawPress}
          disabled={isWithdrawing}
        >
          <XStack
            marginTop="$2"
            borderWidth={1}
            borderColor="rgba(239, 68, 68, 0.4)"
            borderRadius="$lg"
            paddingVertical="$2"
            paddingHorizontal="$3"
            flexDirection="row"
            alignItems="center"
            justifyContent="center"
            gap="$1"
            backgroundColor="rgba(239, 68, 68, 0.12)"
            opacity={isWithdrawing ? 0.6 : 1}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text fontSize={13} fontWeight="$bold" color="#ef4444">
              {isWithdrawing ? "Withdrawing..." : "Withdraw submission"}
            </Text>
          </XStack>
        </TouchableOpacity>
      ) : (
        <Text fontSize={10} color="muted" marginTop="$2">
          Approved submissions cannot be withdrawn.
        </Text>
      )}
    </Card>
  );
}
