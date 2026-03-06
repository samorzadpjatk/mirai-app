import { EmptyState } from "~/components/common/ui";

interface AlertsEmptyStateProps {
  title: string;
  message: string;
}

export function AlertsEmptyState({ title, message }: AlertsEmptyStateProps) {
  return (
    <EmptyState
      icon="alert-circle"
      title={title}
      subtitle={message}
      iconOpacity={0.5}
    />
  );
}
