"use client";

import { EditUserForm } from "./EditUserForm";

interface EditUserContentProps {
  userId: string;
}

export function EditUserContent({ userId }: EditUserContentProps) {
  return <EditUserForm userId={userId} />;
}
