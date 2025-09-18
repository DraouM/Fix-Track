// src/utils/withAsync.ts
type AsyncOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
};

export async function withAsync<T>(
  promise: Promise<T>,
  options?: AsyncOptions<T>
): Promise<[T | null, any]> {
  try {
    const data = await promise;
    options?.onSuccess?.(data);
    return [data, null];
  } catch (error) {
    options?.onError?.(error);
    return [null, error];
  }
}
