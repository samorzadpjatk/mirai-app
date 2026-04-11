"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useQuery, useMutation, useClient } from "urql";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { appToast } from "../../../lib/toast";
import {
  GetRewardDocument,
  GetTotalAvailablePointsDocument,
  CreateRewardDocument,
  UpdateRewardDocument,
  SetRewardHiddenDocument,
  DeleteRewardDocument,
} from "@mirai-app/graphql-client/urql";
import { useWebFileUpload } from "../../../hooks/useWebFileUpload";
import { useTrip } from "../../../contexts/TripContext";

interface RewardFormProps {
  mode: "create" | "edit";
  rewardId?: string;
}

export function RewardForm({ mode, rewardId }: RewardFormProps) {
  const { selectedTrip } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const isEditMode = mode === "edit";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coinCostPercentage, setCoinCostPercentage] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [existingImagePath, setExistingImagePath] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const client = useClient();

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

  // GraphQL Queries using urql
  const [rewardResult] = useQuery({
    query: GetRewardDocument,
    variables: { id: rewardId ?? "" },
    pause: !isEditMode || !rewardId,
  });

  const [totalPointsResult] = useQuery({
    query: GetTotalAvailablePointsDocument,
    variables: { tripId },
    pause: !tripId,
  });

  // GraphQL Mutations using urql
  const [, createReward] = useMutation(CreateRewardDocument);
  const [, updateReward] = useMutation(UpdateRewardDocument);
  const [, setRewardHidden] = useMutation(SetRewardHiddenDocument);
  const [, deleteReward] = useMutation(DeleteRewardDocument);

  // Populate form when editing
  useEffect(() => {
    if (!isEditMode || !rewardResult.data?.reward) {
      return;
    }

    const reward = rewardResult.data.reward;

    setName(reward.name);
    setDescription(reward.description);
    setCoinCostPercentage(String(reward.coinCostPercentage));
    setAvailableQuantity(String(reward.availableQuantity));
    setIsHidden(reward.isHidden);
    setExistingImagePath(reward.primaryImage ?? (reward.images[0] || ""));
    setExistingImageUrl(reward.primaryImage ?? (reward.images[0] || null));
  }, [isEditMode, rewardResult.data]);

  const invalidateRewards = () => {
    // Invalidate rewards list
    // Note: urql doesn't support query key invalidation like react-query
    // Instead, we can use document-based invalidation or refetch
  };

  const isUploading = uploadStatus === "uploading";

  const calculatedCoins = useMemo(() => {
    const percentage = Number.parseInt(coinCostPercentage, 10);
    const total =
      totalPointsResult.data?.totalAvailablePoints?.totalPoints ?? 0;

    if (!Number.isFinite(percentage) || percentage <= 0 || total <= 0) {
      return null;
    }

    return Math.max(1, Math.round(total * (percentage / 100)));
  }, [coinCostPercentage, totalPointsResult.data]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setIsSaving(true);
    const toastId = appToast.loading(
      isEditMode ? "Updating reward..." : "Creating reward...",
    );

    try {
      let imagePath = existingImagePath || "";

      if (selectedFile) {
        const storagePath = `rewards/${tripId}/reward-${Date.now()}.${selectedFile.name.split(".").pop()?.toLowerCase() ?? "jpg"}`;
        const uploadResult = await upload({
          storagePath,
          file: selectedFile,
          upsert: true,
        });

        imagePath = uploadResult.storagePath;
        await verifyFileAccessible(uploadResult.storagePath);
      }

      if (isEditMode) {
        const updateResult = await updateReward({
          input: {
            id: rewardId ?? "",
            name: trimmedName,
            description: trimmedDescription,
            coinCost: parsedCoinCost,
            availableQuantity: parsedQuantity,
            images: imagePath ? [imagePath] : [],
          },
        });

        if (updateResult.error) {
          throw updateResult.error;
        }

        const currentHiddenValue = rewardResult.data?.reward?.isHidden ?? false;
        if (currentHiddenValue !== isHidden) {
          const hiddenResult = await setRewardHidden({
            rewardId: rewardId ?? "",
            isHidden,
          });

          if (hiddenResult.error) {
            throw hiddenResult.error;
          }
        }
      } else {
        const createResult = await createReward({
          input: {
            tripId,
            name: trimmedName,
            description: trimmedDescription,
            coinCost: parsedCoinCost,
            availableQuantity: parsedQuantity,
            images: imagePath ? [imagePath] : [],
            isHidden,
          },
        });

        if (createResult.error) {
          throw createResult.error;
        }
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
    } finally {
      setIsSaving(false);
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

    setIsDeleting(true);
    const toastId = appToast.loading("Deleting reward...");

    try {
      const result = await deleteReward({ id: rewardId });

      if (result.error) {
        throw result.error;
      }

      appToast.dismiss(toastId);
      appToast.success("Reward deleted.");
      window.location.href = "/rewards";
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Failed to delete reward.",
      );
      setIsDeleting(false);
    }
  };

  if (isEditMode && rewardResult.fetching) {
    return <LoadingSpinner label="Loading reward..." />;
  }

  if (isEditMode && !rewardResult.data?.reward) {
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
          of {totalPointsResult.data?.totalAvailablePoints?.totalPoints ?? 0})
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
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting..." : "Delete reward"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
