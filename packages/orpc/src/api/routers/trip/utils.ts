import { resolveStorageUrl } from "@mirai-app/shared/storage";

export const resolveGroupImage = resolveStorageUrl;

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

export type ClientTripResource = ReturnType<typeof toClientTripResource>;

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
