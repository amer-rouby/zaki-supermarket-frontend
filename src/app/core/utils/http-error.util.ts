import { catchError, Observable, of, OperatorFunction } from 'rxjs';

/** RxJS catchError handler — replaces duplicated private handleError in services. */
export function httpErrorFallback<T>(operation: string, fallback?: T) {
  return (error: unknown): Observable<T> => {
    console.error(`${operation} failed:`, error);
    return of(fallback as T);
  };
}

/** Pipeable operator with explicit result type. */
export function withHttpErrorFallback<T>(operation: string, fallback?: T): OperatorFunction<T, T> {
  return catchError(httpErrorFallback<T>(operation, fallback));
}
