interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
      {message}
    </div>
  );
}
