"use client";

import { useEffect, useMemo, useState } from "react";
import { GraphQLClient } from "graphql-request";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { appToast } from "../../../lib/toast";
import { useTrip } from "../../../contexts/TripContext";
import {
  useGetGroupsByTripQuery,
  useAddCoinsMutation,
  useRemoveCoinsMutation,
} from "@mirai-app/graphql-types";
import { env } from "../../../lib/env";

interface CoinOperationFormProps {
  operation: "add" | "remove";
  initialGroupId: string;
}

const createGraphQLClient = (): GraphQLClient => {
  const getAuthToken = (): string | null => {
    const cookies = document.cookie.split(";");
    const tokenCookie = cookies.find((c) =>
      c.trim().startsWith("sb-access-token="),
    );
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  };

  return new GraphQLClient(env.graphqlUrl, {
    headers: () => {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return headers;
    },
  });
};

export function CoinOperationForm({
  operation,
  initialGroupId,
}: CoinOperationFormProps) {
  const { selectedTrip, isLoading: tripsLoading } = useTrip();
  const tripId = selectedTrip?.id ?? "";
  const [groupId, setGroupId] = useState(initialGroupId || "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const client = useMemo(() => createGraphQLClient(), []);
  const queryClient = useQueryClient();

  const { data: groupsData, isLoading: groupsLoading } =
    useGetGroupsByTripQuery(
      client,
      {
        tripId,
      },
      {
        enabled: Boolean(tripId),
        staleTime: 30000,
      },
    );

  const groups = useMemo(() => {
    return groupsData?.groupsByTrip?.groups ?? [];
  }, [groupsData]);

  const addCoinsMutation = useAddCoinsMutation(client, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetGroupsByTrip"],
      });
    },
  });

  const removeCoinsMutation = useRemoveCoinsMutation(client, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["GetGroupsByTrip"],
      });
    },
  });

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId) ?? null,
    [groups, groupId],
  );

  useEffect(() => {
    if (groupId && !groups.some((group) => group.id === groupId)) {
      setGroupId("");
    }
  }, [groups, groupId]);

  const isSubmitting =
    operation === "add"
      ? addCoinsMutation.isPending
      : removeCoinsMutation.isPending;

  const title = operation === "add" ? "Add Coins" : "Remove Coins";
  const submitLabel = operation === "add" ? "Add coins" : "Remove coins";

  const handleSubmit = async () => {
    const numericAmount = Number.parseInt(amount, 10);

    if (!tripId || !groupId) {
      appToast.error("Select trip and group.");
      return;
    }

    if (!amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      appToast.error("Enter a valid positive amount.");
      return;
    }

    if (!reason.trim()) {
      appToast.error("Reason is required.");
      return;
    }

    const toastId = appToast.loading(`${submitLabel}...`);
    try {
      if (operation === "add") {
        await addCoinsMutation.mutateAsync({
          input: {
            groupId,
            amount: numericAmount,
            reason: reason.trim(),
          },
        });
      } else {
        await removeCoinsMutation.mutateAsync({
          input: {
            groupId,
            amount: numericAmount,
            reason: reason.trim(),
          },
        });
      }

      appToast.dismiss(toastId);
      appToast.success(`${title} completed.`);
      setAmount("");
      setReason("");
    } catch (error) {
      appToast.dismiss(toastId);
      appToast.error(
        error instanceof Error ? error.message : "Operation failed.",
      );
    }
  };

  if (tripsLoading) {
    return <LoadingSpinner label="Loading trips..." />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Apply a manual coin adjustment to a group.
        </p>
      </header>

      <Card className="space-y-4">
        <div className="grid gap-3">
          <Select
            label="Group"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            options={groups.map((group) => ({
              value: group.id,
              label: group.name,
            }))}
            placeholder={groupsLoading ? "Loading groups..." : "Select group"}
            disabled={!tripId || groupsLoading}
          />
        </div>

        {selectedGroup ? (
          <p className="text-sm text-text-secondary">
            Current balance:{" "}
            <span className="font-semibold text-text-primary">
              {selectedGroup.coins}
            </span>
          </p>
        ) : null}

        <Input
          label="Amount"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value.replace(/[^0-9]/g, ""))
          }
          placeholder="Enter amount"
          inputMode="numeric"
        />
        <Input
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why are you adjusting coins?"
        />

        <div className="flex flex-wrap gap-2">
          <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          <a
            href="/coins"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-card"
          >
            Back to coins overview
          </a>
        </div>
      </Card>

      {!tripId ? (
        <ErrorMessage message="Select a trip from the navbar to continue." />
      ) : null}
    </section>
  );
}
