import { YStack, Paragraph, Button, Spinner, XStack } from "tamagui";
import { Download } from "@tamagui/lucide-icons";
import { useState } from "react";
import { Linking } from "react-native";

// Note: This is a simplified version for React Native.
// For full PDF viewing on React Native, use react-native-pdf or similar library.

interface PDFViewerProps {
  src?: string;
}

export default function PDFViewer({ src = "/dummy.pdf" }: PDFViewerProps) {
  const [isLoading] = useState(false);

  const handleDownload = () => {
    void Linking.openURL(src);
  };

  return (
    <YStack
      flex={1}
      p="$4"
      rounded="$4"
      borderWidth={1}
      borderColor="$gray7"
      bg="$background"
      items="center"
      justify="center"
      minH={300}
    >
      <XStack gap="$3" p="$4">
        <Button
          icon={<Download size={20} />}
          onPress={handleDownload}
          
        >
          Download Map
        </Button>
      </XStack>
      
      {isLoading ? (
        <Spinner size="large" />
      ) : (
        <Paragraph text="center">
          PDF Viewer not available in this environment.{"\n"}
          Use the download button to view the map.
        </Paragraph>
      )}
    </YStack>
  );
}
