export type Option<T> =
  | { readonly some: true; readonly value: T }
  | { readonly some: false; readonly value?: never };

export const Option = {
  some: <T>(value: T): Option<T> => ({ some: true, value }),
  none: <T>(_dummy?: T): Option<T> => ({ some: false as const }),
  fromNullable: <T>(value: unknown): Option<T> =>
    value !== null && value !== void 0 ? Option.some(value as T) : Option.none(),

  unwrapOr: <T>(opt: Option<T>, fallback: T): T => (opt.some ? opt.value : fallback),
};

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Result = {
  ok: <T, E>(value: T, _errType?: E): Result<T, E> => ({ ok: true, value }),
  err: <T, E>(error: E, _valType?: T): Result<T, E> => ({ ok: false, error }),
};
