"use client";

import { EditGroupForm } from "./EditGroupForm";

interface EditGroupContentProps {
  groupId: string;
}

export function EditGroupContent({ groupId }: EditGroupContentProps) {
  return <EditGroupForm groupId={groupId} />;
}
