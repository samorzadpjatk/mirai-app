"use client";

import { useMemo, useState } from "react";
import { Modal } from "../../ui/Modal";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import type { JudgementSubmission } from "../../../hooks/admin/useJudgement";

interface JudgmentFormProps {
  submission: JudgementSubmission;
  isSubmitting: boolean;
  onSubmit: (input: {
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
    awardedPoints?: number;
    bonusPoints?: number;
    ranking?: 1 | 2 | 3;
  }) => Promise<void>;
}

export function JudgmentForm({
  submission,
  isSubmitting,
  onSubmit,
}: JudgmentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [rejectionReason, setRejectionReason] = useState("");
  const [awardedPoints, setAwardedPoints] = useState("");
  const [bonusPoints, setBonusPoints] = useState("");
  const [ranking, setRanking] = useState("");
  const [notes, setNotes] = useState("");

  const parsedRanking = useMemo(() => {
    const value = Number.parseInt(ranking, 10);
    if (value === 1 || value === 2 || value === 3) {
      return value;
    }
    return undefined;
  }, [ranking]);

  const canSubmit = useMemo(() => {
    if (status === "REJECTED") {
      return rejectionReason.trim().length > 0;
    }
    return true;
  }, [rejectionReason, status]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    await onSubmit({
      status,
      rejectionReason:
        status === "REJECTED" ? rejectionReason.trim() : undefined,
      awardedPoints: awardedPoints.trim()
        ? Number.parseInt(awardedPoints, 10)
        : undefined,
      bonusPoints: bonusPoints.trim()
        ? Number.parseInt(bonusPoints, 10)
        : undefined,
      ranking: parsedRanking,
    });

    setIsOpen(false);
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        Judge submission
      </Button>

      <Modal
        isOpen={isOpen}
        title="Judge submission"
        onClose={() => setIsOpen(false)}
      >
        <div className="space-y-4">
          <Card className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              {submission.group.name}
            </p>
            <p className="text-xs text-text-muted">
              Current status: {submission.status}
            </p>
          </Card>

          <div className="grid gap-2 md:grid-cols-2">
            <Button
              type="button"
              variant={status === "APPROVED" ? "primary" : "secondary"}
              onClick={() => setStatus("APPROVED")}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant={status === "REJECTED" ? "danger" : "secondary"}
              onClick={() => setStatus("REJECTED")}
            >
              Reject
            </Button>
          </div>

          {status === "REJECTED" ? (
            <Input
              label="Rejection reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Explain why this is rejected"
            />
          ) : (
            <>
              <Input
                label="Awarded points"
                value={awardedPoints}
                onChange={(event) => setAwardedPoints(event.target.value)}
                placeholder="Optional"
              />
              <Input
                label="Bonus points"
                value={bonusPoints}
                onChange={(event) => setBonusPoints(event.target.value)}
                placeholder="Optional"
              />
              <Input
                label="Final ranking"
                value={ranking}
                onChange={(event) => setRanking(event.target.value)}
                placeholder="1, 2, or 3"
              />
            </>
          )}

          <Input
            label="Judge notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Internal notes"
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? "Saving..." : "Save judgment"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
