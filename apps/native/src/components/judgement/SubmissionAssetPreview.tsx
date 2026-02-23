import { View, Text, ActivityIndicator, Modal, Pressable, useWindowDimensions } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Camera, MapView, MarkerView } from '@maplibre/maplibre-react-native';
import exifr from 'exifr';
import { colors } from '~/styles';
import { type Submission } from '~/contexts/JudgementContext';
import { useFileDownload } from '~/hooks/files';
import { viewStyles, textStyles } from '~/styles/judgement';
import { borderRadius, spacing } from '~/styles/spacing';

type ExifEntries = { label: string; value: string }[];
interface GpsCoordinate {
  latitude: number;
  longitude: number;
}

const EXIF_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/fiord';

const formatExifDate = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;

  const normalized = value.trim().replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, '$1-$2-$3');
  const parsedDate = new Date(normalized);
  if (!Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(parsedDate);
  }

  return value;
};

const formatExifAperture = (value: unknown): string | null => {
  if (typeof value === 'number') return `f/${value.toFixed(1)}`;
  if (typeof value === 'string' && value.trim().length > 0) return `f/${value.trim()}`;
  return null;
};

const formatExifExposureTime = (value: unknown): string | null => {
  if (typeof value === 'number') {
    if (value <= 0) return null;
    if (value >= 1) return `${value.toFixed(1)} s`;

    const denominator = Math.round(1 / value);
    if (denominator > 0) {
      return `1/${denominator} s`;
    }
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const trimmed = value.trim();
    if (trimmed.includes('/')) return `${trimmed} s`;

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) return formatExifExposureTime(numeric);
    return trimmed;
  }

  return null;
};

const formatExifFocalLength = (value: unknown): string | null => {
  if (typeof value === 'number') return `${value.toFixed(1)} mm`;
  if (typeof value === 'string' && value.trim().length > 0) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return `${numeric.toFixed(1)} mm`;
    return `${value.trim()} mm`;
  }
  return null;
};

const formatExifGps = (latitude: unknown, longitude: unknown): string | null => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

  const latitudeDirection = latitude >= 0 ? 'N' : 'S';
  const longitudeDirection = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(5)}° ${latitudeDirection}, ${Math.abs(longitude).toFixed(5)}° ${longitudeDirection}`;
};

const resolveExifEntries = (metadata: Record<string, unknown>): ExifEntries => {
  const exifDate = metadata.DateTimeOriginal;
  const make = metadata.Make;
  const model = metadata.Model;
  const iso = metadata.ISO;
  const aperture = metadata.FNumber;
  const exposure = metadata.ExposureTime;
  const focalLength = metadata.FocalLength;
  const latitude = metadata.latitude;
  const longitude = metadata.longitude;

  const entries: ExifEntries = [];

  const formattedDate = formatExifDate(exifDate);
  if (formattedDate) {
    entries.push({ label: 'Data wykonania', value: formattedDate });
  }
  if (typeof make === 'string' && make.trim().length > 0) {
    entries.push({ label: 'Marka', value: make.trim() });
  }
  if (typeof model === 'string' && model.trim().length > 0) {
    entries.push({ label: 'Model', value: model.trim() });
  }
  if (typeof iso === 'number' || typeof iso === 'string') {
    entries.push({ label: 'ISO', value: String(iso) });
  }
  const formattedAperture = formatExifAperture(aperture);
  if (formattedAperture) {
    entries.push({ label: 'Przysłona', value: formattedAperture });
  }
  const formattedExposureTime = formatExifExposureTime(exposure);
  if (formattedExposureTime) {
    entries.push({ label: 'Czas naświetlania', value: formattedExposureTime });
  }
  const formattedFocalLength = formatExifFocalLength(focalLength);
  if (formattedFocalLength) {
    entries.push({ label: 'Ogniskowa', value: formattedFocalLength });
  }
  const formattedGps = formatExifGps(latitude, longitude);
  if (formattedGps) {
    entries.push({
      label: 'GPS',
      value: formattedGps,
    });
  }

  return entries;
};

const SubmissionAssetPreview = ({ submission }: { submission: Submission }) => {
  const { width, height } = useWindowDimensions();
  const hasImage = submission.imageIds.length > 0;
  const hasVideo = Boolean(submission.videoId);
  const videoContainerRef = useRef<View>(null);
  const [isVideoFullyVisible, setIsVideoFullyVisible] = useState(false);
  const [isFullscreenImageVisible, setIsFullscreenImageVisible] = useState(false);
  const [isFullscreenMapVisible, setIsFullscreenMapVisible] = useState(false);
  const [isExifLoading, setIsExifLoading] = useState(false);
  const [exifEntries, setExifEntries] = useState<ExifEntries>([]);
  const [imageGps, setImageGps] = useState<GpsCoordinate | null>(null);
  const {
    download: downloadImage,
    status: imageStatus,
    file: imageFile,
    reset: resetImage,
    abort: abortImage,
  } = useFileDownload();
  const {
    download: downloadVideo,
    status: videoStatus,
    file: videoFile,
    reset: resetVideo,
    abort: abortVideo,
  } = useFileDownload();

  const videoPlayer = useVideoPlayer(videoFile?.uri ? { uri: videoFile.uri, useCaching: true } : null, (player) => {
    player.muted = true;
    player.loop = true;
  });

  const checkVideoVisibility = useCallback(() => {
    if (!videoContainerRef.current) return;
    videoContainerRef.current.measureInWindow((x, y, layoutWidth, layoutHeight) => {
      const fullyVisible =
        x >= 0 &&
        y >= 0 &&
        x + layoutWidth <= width &&
        y + layoutHeight <= height;
      setIsVideoFullyVisible(fullyVisible);
    });
  }, [height, width]);

  useEffect(() => {
    if (!hasImage) {
      resetImage();
      setIsFullscreenImageVisible(false);
      setIsFullscreenMapVisible(false);
      setExifEntries([]);
      setIsExifLoading(false);
      setImageGps(null);
      return;
    }

    resetImage();
    void downloadImage({
      storagePath: submission.imageIds[0] ?? "",
      skipCache: true,
    }).catch(() => {
      // Submission metadata can arrive before the file is reachable in storage.
      // The UI already handles missing image with a fallback state.
    });

    return () => {
      abortImage();
    };
  }, [abortImage, downloadImage, hasImage, resetImage, submission.imageIds]);

  useEffect(() => {
    if (!hasImage || !imageFile?.uri) {
      setExifEntries([]);
      setIsExifLoading(false);
      setImageGps(null);
      return;
    }

    let isCancelled = false;
    setIsExifLoading(true);

    const parseExif = async () => {
      try {
        const response = await fetch(imageFile.uri);
        const buffer = await response.arrayBuffer();
        const parsed = (await exifr.parse(buffer)) as unknown;

        if (isCancelled || !parsed || typeof parsed !== 'object') {
          if (!isCancelled) setExifEntries([]);
          return;
        }

        const entries = resolveExifEntries(parsed as Record<string, unknown>);
        const parsedRecord = parsed as Record<string, unknown>;
        const latitude = parsedRecord.latitude;
        const longitude = parsedRecord.longitude;
        if (!isCancelled) {
          setExifEntries(entries);
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            setImageGps({ latitude, longitude });
          } else {
            setImageGps(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setExifEntries([]);
          setImageGps(null);
        }
      } finally {
        if (!isCancelled) {
          setIsExifLoading(false);
        }
      }
    };

    void parseExif();

    return () => {
      isCancelled = true;
    };
  }, [hasImage, imageFile?.uri]);

  const previewCoordinate = useMemo(
    () =>
      imageGps ??
      (typeof submission.latitude === 'number' && typeof submission.longitude === 'number'
        ? { latitude: submission.latitude, longitude: submission.longitude }
        : null),
    [imageGps, submission.latitude, submission.longitude],
  );

  const openFullscreenImage = useCallback(() => {
    if (!imageFile?.uri) return;
    setIsFullscreenImageVisible(true);
  }, [imageFile?.uri]);

  const closeFullscreenImage = useCallback(() => {
    setIsFullscreenImageVisible(false);
  }, []);

  const openFullscreenMap = useCallback(() => {
    if (!previewCoordinate) return;
    setIsFullscreenMapVisible(true);
  }, [previewCoordinate]);

  const closeFullscreenMap = useCallback(() => {
    setIsFullscreenMapVisible(false);
  }, []);

  useEffect(() => {
    if (!hasVideo) {
      resetVideo();
      return;
    }

    resetVideo();
    void downloadVideo({
      storagePath: submission.videoId ?? "",
      skipCache: true,
    }).catch(() => {
      // Video may be temporarily unavailable; render fallback instead.
    });

    return () => {
      abortVideo();
    };
  }, [abortVideo, downloadVideo, hasVideo, resetVideo, submission.videoId]);

  useEffect(() => {
    if (!videoFile?.uri) return;
    checkVideoVisibility();
  }, [checkVideoVisibility, videoFile?.uri]);

  useEffect(() => {
    if (!videoFile?.uri) return;
    if (isVideoFullyVisible) {
      void videoPlayer.play();
    } else {
      void videoPlayer.pause();
    }
  }, [isVideoFullyVisible, videoFile?.uri, videoPlayer]);

  if (hasImage) {
    return (
      <>
        <View style={viewStyles.mediaWrapper}>
          {imageStatus === 'loading' ? (
            <View style={viewStyles.mediaLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : imageFile?.uri ? (
            <Pressable onPress={openFullscreenImage}>
              <Image
                source={{ uri: imageFile.uri }}
                style={viewStyles.mediaImage}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <View style={viewStyles.mediaLoading}>
              <Ionicons name="image" size={36} color={colors.textSecondary} />
              <Text style={textStyles.videoLabel}>Image unavailable</Text>
            </View>
          )}
          {submission.imageIds.length > 1 && (
            <View style={viewStyles.mediaBadge}>
              <Ionicons name="images" size={14} color={colors.white} />
              <Text style={textStyles.mediaBadgeText}>{submission.imageIds.length}</Text>
            </View>
          )}
        </View>

        <View style={viewStyles.exifBlock}>
          <Text style={textStyles.exifTitle}>Dane EXIF</Text>
          {isExifLoading ? (
            <View style={viewStyles.exifLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : exifEntries.length > 0 ? (
            exifEntries.map((entry) => (
              <View key={entry.label} style={viewStyles.exifRow}>
                <Text style={textStyles.exifLabel}>{entry.label}</Text>
                <Text style={textStyles.exifValue}>{entry.value}</Text>
              </View>
            ))
          ) : (
            <Text style={textStyles.exifEmpty}>Brak dostępnych danych EXIF</Text>
          )}
        </View>

        {previewCoordinate && (
          <View style={viewStyles.exifBlock}>
            <Text style={textStyles.exifTitle}>Lokalizacja na mapie</Text>
            <Pressable
              onPress={openFullscreenMap}
              style={{
                height: 180,
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.borderDark,
              }}
            >
              <MapView
                mapStyle={EXIF_MAP_STYLE_URL}
                style={{ flex: 1 }}
                logoEnabled={false}
                compassEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Camera
                  defaultSettings={{
                    centerCoordinate: [previewCoordinate.longitude, previewCoordinate.latitude],
                    zoomLevel: 14,
                  }}
                />
                <MarkerView
                  coordinate={[previewCoordinate.longitude, previewCoordinate.latitude]}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: borderRadius.full,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.white,
                    }}
                  >
                    <Ionicons name="location" size={16} color={colors.white} />
                  </View>
                </MarkerView>
              </MapView>
            </Pressable>
            <Text style={[textStyles.locationText, { marginTop: spacing.xs }] }>
              {Math.abs(previewCoordinate.latitude).toFixed(5)}° {previewCoordinate.latitude >= 0 ? 'N' : 'S'},{' '}
              {Math.abs(previewCoordinate.longitude).toFixed(5)}° {previewCoordinate.longitude >= 0 ? 'E' : 'W'}
            </Text>
          </View>
        )}

        {previewCoordinate && (
          <Modal
            visible={isFullscreenMapVisible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={closeFullscreenMap}
          >
            <View style={{ flex: 1, backgroundColor: colors.backgroundDark }}>
              <MapView
                mapStyle={EXIF_MAP_STYLE_URL}
                style={{ flex: 1 }}
                logoEnabled={false}
                compassEnabled
                rotateEnabled
                pitchEnabled
                scrollEnabled
                zoomEnabled
              >
                <Camera
                  defaultSettings={{
                    centerCoordinate: [previewCoordinate.longitude, previewCoordinate.latitude],
                    zoomLevel: 15,
                  }}
                />
                <MarkerView
                  coordinate={[previewCoordinate.longitude, previewCoordinate.latitude]}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: borderRadius.full,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.white,
                    }}
                  >
                    <Ionicons name="location" size={18} color={colors.white} />
                  </View>
                </MarkerView>
              </MapView>

              <Pressable
                onPress={closeFullscreenMap}
                style={{
                  position: 'absolute',
                  top: spacing.lg,
                  right: spacing.lg,
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.blackOpacity40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </Pressable>
            </View>
          </Modal>
        )}

        <Modal
          visible={isFullscreenImageVisible}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={closeFullscreenImage}
        >
          <View style={viewStyles.fullscreenImageContainer}>
            <Pressable style={viewStyles.fullscreenImageClose} onPress={closeFullscreenImage}>
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
            {imageFile?.uri ? (
              <Image
                source={{ uri: imageFile.uri }}
                style={viewStyles.fullscreenImage}
                contentFit="contain"
              />
            ) : (
              <View style={viewStyles.mediaLoading}>
                <Ionicons name="image" size={36} color={colors.textSecondary} />
                <Text style={textStyles.videoLabel}>Image unavailable</Text>
              </View>
            )}
          </View>
        </Modal>
      </>
    );
  }

  if (hasVideo) {
    return (
      <View
        ref={videoContainerRef}
        style={[viewStyles.mediaWrapper, viewStyles.videoPlaceholder]}
        onLayout={checkVideoVisibility}
      >
        {videoFile?.uri ? (
          <VideoView player={videoPlayer} style={viewStyles.mediaImage} />
        ) : videoStatus === 'loading' ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="play-circle" size={48} color={colors.white} />
        )}
        {!videoFile?.uri && (
          <Text style={textStyles.videoLabel}>
            {videoStatus === 'loading' ? 'Loading video' : 'Video submission'}
          </Text>
        )}
      </View>
    );
  }

  return null;
};

export { SubmissionAssetPreview };
