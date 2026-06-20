import { Image, type ImageProps } from "expo-image";
import { ActivityIndicator, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useImageUrl } from "~/hooks/images";

export interface CachedImageProps extends Omit<ImageProps, "source"> {
  source?: ImageProps["source"];
  storagePath?: string | null;
  cacheKey?: string | null;
  fallback?: React.ReactNode;
}

function StorageCachedImage({
  storagePath,
  cacheKey,
  fallback,
  style,
  placeholder,
  ...imageProps
}: CachedImageProps & { storagePath: string }) {
  const { data: urlData, isLoading } = useImageUrl(storagePath, cacheKey);

  const resolvedSource = urlData?.signedUrl ? { uri: urlData.signedUrl } : null;

  if (!resolvedSource) {
    if (fallback) {
      return <View style={[styles.container, style as StyleProp<ViewStyle>]}>{fallback}</View>;
    }

    if (isLoading) {
      return (
        <View style={[styles.container, style as StyleProp<ViewStyle>]}>
          <ActivityIndicator />
        </View>
      );
    }

    return null;
  }

  return (
    <Image
      source={resolvedSource}
      style={style}
      placeholder={placeholder}
      cachePolicy="memory-disk"
      transition={200}
      {...imageProps}
    />
  );
}

export function CachedImage({ source, storagePath, fallback, style, ...props }: CachedImageProps) {
  if (storagePath) {
    return (
      <StorageCachedImage storagePath={storagePath} fallback={fallback} style={style} {...props} />
    );
  }

  if (!source) {
    if (fallback) {
      return <View style={[styles.container, style as StyleProp<ViewStyle>]}>{fallback}</View>;
    }

    return null;
  }

  return (
    <Image source={source} style={style} cachePolicy="memory-disk" transition={200} {...props} />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
