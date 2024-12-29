export type Warning = {
  message: string;
  meta: any;
};

export type Ok<T> = {
  ok: true;
  value: T;
  warnings: Warning[];
};

export type Err = {
  ok: false;
  warnings: Warning[];
};

export type Result<T> = Ok<T> | Err;

export function warning(message: string, meta: any = {}): Warning {
  console.warn("⚠️⚠️⚠️⚠️⚠️⚠️  WARNING  ⚠️⚠️⚠️⚠️⚠️⚠️");
  console.warn(message);
  console.warn(meta);
  return { message, meta };
}

export function ok<T>(value: T, warnings: Warning[] = []): Ok<T> {
  return { ok: true, value, warnings };
}

export function err(warning: Warning): Err;
export function err(warnings: Warning[]): Err;
export function err(w: undefined | Warning | Warning[]): Err {
  if (w === undefined) {
    return { ok: false, warnings: [] };
  } else if (Array.isArray(w)) {
    return { ok: false, warnings: w };
  }
  return { ok: false, warnings: [w] };
}

/**
 * Takes a list of results and returns a result with the list of values
 * ignoring the errors and the list of all warnings.
 */
export function keepOk<T>(results: Result<T>[]): Ok<T[]> {
  const values: T[] = [];
  const warnings: Warning[] = [];
  for (const result of results) {
    if (result.ok) {
      values.push(result.value);
    }
    warnings.push(...result.warnings);
  }
  return ok(values, warnings);
}
