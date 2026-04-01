"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { appToast } from "../../../lib/toast";
import { useTRPCClient } from "@mirai-app/trpc/client";
import { useAdminRewards } from "@mirai-app/trpc/hooks";
import { useWebFileUpload } from "../../../hooks/useWebFileUpload";
import { useTrip } from "../../../contexts/TripContext";

interface RewardFormProps {
  mode: "create" | "edit";
  rewardId?: string;
}

const createStoragePath = (tripId: string, fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `rewards/${tripId}/reward-${Date.now()}.${extension}`;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function RewardForm({ mode, rewardId }: RewardFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const isEditMode = mode === "edit";
  const trpcClient = useTRPCClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coinCostPercentage, setCoinCostPercentage] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [existingImagePath, setExistingImagePath] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    createReward,
    isCreatingReward,
    updateReward,
    isUpdatingReward,
    setRewardHidden,
    isSettingRewardHidden,
    deleteReward,
    isDeletingReward,
  } = useAdminRewards(tripId, "");

  const {
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
    selectedFile,
    previewUrl,
    onFileInputChange,
    clearSelection,
    upload,
    verifyFileAccessible,
  } = useWebFileUpload();

  const rewardQuery = useQuery({
    queryKey: ["rewards", "details", rewardId],
    enabled: isEditMode && Boolean(rewardId),
    queryFn: async () => {
      const result = await trpcClient.reward.getById.query({
        id: rewardId ?? "",
      });
      if (!isObject(result) || typeof result.id !== "string") {
        throw new Error("Invalid reward response.");
      }
      return result;
    },
  });

  useEffect(() => {
    if (!isEditMode || !rewardQuery.data) {
      return;
    }

    const reward = rewardQuery.data;

    setName(typeof reward.name === "string" ? reward.name : "");
    setDescription(
      typeof reward.description === "string" ? reward.description : "",
    );
    setCoinCostPercentage(
      typeof reward.originalCoinCost === "number"
        ? String(reward.originalCoinCost)
        : typeof reward.coinCost === "number"
          ? String(reward.coinCost)
          : "",
    );
    setAvailableQuantity(
      typeof reward.availableQuantity === "number"
        ? String(reward.availableQuantity)
        : "",
    );
    setIsHidden(Boolean(reward.isHidden));
    setExistingImagePath(typeof reward.image === "string" ? reward.image : "");
    setExistingImageUrl(
      typeof reward.signedImageUrl === "string" ? reward.signedImageUrl : null,
    );
  }, [isEditMode, rewardQuery.data]);

  const isSaving =
    isCreatingReward || isUpdatingReward || isSettingRewardHidden;
  const isUploading = uploadStatus === "uploading";

  const totalPointsQuery = useQuery({
    queryKey: ["rewards", "total-points", tripId],
    enabled: Boolean(tripId),
    queryFn: async () => {
      const result = await trpcClient.reward.getTotalAvailablePoints.query({
        tripId,
      });
      if (!isObject(result) || typeof result.totalPoints !== "number") {
        return 0;
      }
      return result.totalPoints;
    },
  });

  const calculatedCoins = useMemo(() => {
    const percentage = Number.parseInt(coinCostPercentage, 10);
    const total = totalPointsQuery.data ?? 0;

    if (!Number.isFinite(percentage) || percentage <= 0 || total <= 0) {
      return null;
    }

    return Math.max(1, Math.round(total * (percentage / 100)));
  }, [coinCostPercentage, totalPointsQuery.data]);

  const onSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);

    if (isEditMode && !rewardId) {
      setFormError("Missing reward id.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedCoinCost = Number.parseInt(coinCostPercentage, 10);
    const parsedQuantity = Number.parseInt(availableQuantity, 10);

    if (!trimmedName) {
      setFormError("Reward name is required.");
      return;
    }
    if (!trimmedDescription) {
      setFormError("Reward description is required.");
      return;
    }
    if (
      !Number.isFinite(parsedCoinCost) ||
      parsedCoinCost < 1 ||
      parsedCoinCost > 100
    ) {
      setFormError("Coin cost percentage must be between 1 and 100.");
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      setFormError("Available quantity must be 0 or greater.");
      return;
    }
    if (isUploading) {
      setFormError("Please wait for image upload to finish.");
      return;
    }

    const toastId = appToast.loading(
      isEditMode ? "Updating reward..." : "Creating reward...",
    );

    try {
      let imagePath = existingImagePath || "";

      if (selectedFile) {
        const storagePath = createStoragePath(tripId, selectedFile.name);
        const uploadResult = await upload({
          storagePath,
          file: selectedFile,
          upsert: true,
        });

        imagePath = uploadResult.storagePath;
        await verifyFileAccessible(uploadResult.storagePath);
      }

      if (isEditMode) {
        await updateReward({
          id: rewardId ?? "",
          name: trimmedName,
          description: trimmedDescription,
          coinCost: parsedCoinCost,
          availableQuantity: parsedQuantity,
          image: imagePath || null,
        });

        const currentHiddenValue = Boolean(rewardQuery.data?.isHidden);
        if (currentHiddenValue !== isHidden) {
          await setRewardHidden({ id: rewardId ?? "", isHidden });
        }
      } else {
        await createReward({
          tripId,
          name: trimmedName,
          description: trimmedDescription,
          coinCost: parsedCoinCost,
          availableQuantity: parsedQuantity,
          image: imagePath || undefined,
          isHidden,
        });
      }

      appToast.dismiss(toastId);
      appToast.success(isEditMode ? "Reward updated." : "Reward created.");
      window.location.href = "/rewards";
    } catch (error) {
      appToast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Failed to save reward.";
      appToast.error(message);
      setFormError(message);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !rewardId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this reward? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    const toastId = appToast.loading("Deleting reward...");
    try {
      await deleteReward({ id: rewardId });
      appToast.dismiss(toastId);
      appToast.success("Reward deleted.");
      window.location.href = "/rewards";
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to delete reward.",
      );
    }
  };

  if (isEditMode && rewardQuery.isLoading) {
    return <LoadingSpinner label="Loading reward..." />;
  }

  if (isEditMode && !rewardQuery.data) {
    return <ErrorMessage message="Could not load reward details." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="Reward name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Branded T-shirt"
        required
      />

      <Input
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Reward details"
        required
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="Coin cost (%)"
          value={coinCostPercentage}
          onChange={(event) => setCoinCostPercentage(event.target.value)}
          placeholder="1-100"
          inputMode="numeric"
          required
        />
        <Input
          label="Available quantity"
          value={availableQuantity}
          onChange={(event) => setAvailableQuantity(event.target.value)}
          placeholder="0"
          inputMode="numeric"
          required
        />
      </div>

      {calculatedCoins != null ? (
        <p className="text-sm text-text-secondary">
          Dynamic price preview: {calculatedCoins} coins ({coinCostPercentage}%
          of {totalPointsQuery.data ?? 0})
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">
          Reward image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onFileInputChange}
          className="block w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary"
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt="New reward preview"
            className="h-56 w-full rounded-lg border border-border-subtle object-cover"
          />
        ) : existingImageUrl ? (
          <img
            src={existingImageUrl}
            alt="Current reward"
            className="h-56 w-full rounded-lg border border-border-subtle object-cover"
          />
        ) : null}

        {isUploading ? (
          <p className="text-sm text-text-secondary">
            Uploading image{" "}
            {uploadProgress.percent != null
              ? `${Math.round(uploadProgress.percent * 100)}%`
              : "..."}
          </p>
        ) : null}

        {selectedFile ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => clearSelection()}
          >
            Clear selected file
          </Button>
        ) : null}

        {uploadError ? <ErrorMessage message={uploadError} /> : null}
      </div>

      <div className="space-y-2">
        <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(event) => setIsHidden(event.target.checked)}
          />
          Hidden from users
        </label>
      </div>

      {formError ? <ErrorMessage message={formError} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving
            ? isEditMode
              ? "Saving..."
              : "Creating..."
            : isEditMode
              ? "Save changes"
              : "Create reward"}
        </Button>
        <a
          href="/rewards"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Cancel
        </a>
        {isEditMode ? (
          <Button
            type="button"
            variant="danger"
            disabled={isDeletingReward}
            onClick={() => void handleDelete()}
          >
            {isDeletingReward ? "Deleting..." : "Delete reward"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
