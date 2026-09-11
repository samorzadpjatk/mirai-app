import {
  DEFAULT_SIGNED_URL_SECONDS,
  IMAGE_TRANSFORMS,
  resolveStorageUrl,
} from "@mirai-app/common/storage";

/** Group images only ever paint small round crests, so they are signed as thumbnails. */
export const resolveGroupImage = (
  supabase: Parameters<typeof resolveStorageUrl>[0],
  path: string | null | undefined,
  seconds: number = DEFAULT_SIGNED_URL_SECONDS,
) => resolveStorageUrl(supabase, path, seconds, IMAGE_TRANSFORMS.thumbnail);

export const toClientTrip = <
  T extends { description?: string | null; backgroundImagePath?: string | null },
>(
  trip: T,
) => ({
  ...trip,
  description: trip.description ?? "",
  backgroundImagePath: trip.backgroundImagePath ?? "",
});

export const toClientTripResource = <
  T extends {
    type: string;
    url?: string | null;
    storagePath?: string | null;
    fileName?: string | null;
    publicUrl?: string | null;
    iconName?: string | null;
    value?: string | null;
    description?: string | null;
  },
>(
  resource: T,
) => ({
  ...resource,
  type: resource.type,
  url: resource.url ?? "",
  storagePath: resource.storagePath ?? "",
  fileName: resource.fileName ?? "",
  publicUrl: resource.publicUrl ?? "",
  iconName: resource.iconName ?? "",
  value: resource.value ?? "",
  description: resource.description ?? "",
});

export const toClientTripInsurance = <
  T extends {
    hospitalName?: string | null;
    hospitalAddress?: string | null;
    hospitalDistance?: string | null;
  },
>(
  insurance: T,
) => ({
  ...insurance,
  hospitalName: insurance.hospitalName ?? "",
  hospitalAddress: insurance.hospitalAddress ?? "",
  hospitalDistance: insurance.hospitalDistance ?? "",
});

export const toClientTripInsuranceStep = <
  T extends {
    exampleCall?: string | null;
    additionalText?: string | null;
  },
>(
  step: T,
) => ({
  ...step,
  exampleCall: step.exampleCall ?? "",
  additionalText: step.additionalText ?? "",
});
