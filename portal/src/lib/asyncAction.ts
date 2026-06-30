type AsyncActionOptions<T> = {
  setLoading: (value: boolean) => void;
  setError: (value: string) => void;
  errorMessage: string | ((error: unknown) => string);
  action: () => Promise<T>;
  onSuccess: (value: T) => void;
};

export async function runAsyncAction<T>({
  setLoading,
  setError,
  errorMessage,
  action,
  onSuccess
}: AsyncActionOptions<T>) {
  setLoading(true);
  setError("");
  try {
    onSuccess(await action());
  } catch (error) {
    setError(typeof errorMessage === "function" ? errorMessage(error) : errorMessage);
  } finally {
    setLoading(false);
  }
}
