interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  message,
  onRetry
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-red-700">{message}</p>
      {onRetry ? (
        <button
          className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
          type="button"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
