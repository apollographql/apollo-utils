export interface FetcherRequestInit {
  method?: string;
  // We explicitly do not allow you to pass in a Headers (or FetcherHeaders)
  // object here, because not all implementations recognize "foreign" Headers
  // objects.
  headers?: Record<string, string>;
  body?: string | Buffer;

  // We explicitly do not support non-portable options like `node-fetch`'s
  // `agent`.
}

export interface FetcherResponse {
  readonly bodyUsed: boolean;
  readonly url: string;
  readonly redirected: boolean;
  readonly status: number;
  readonly ok: boolean;
  readonly statusText: string;
  readonly headers: FetcherHeaders;

  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json(): Promise<any>;

  clone(): FetcherResponse;
}

export interface FetcherHeaders extends Iterable<[string, string]> {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;

  entries(): Iterator<[string, string]>;
  keys(): Iterator<string>;
  values(): Iterator<string>;
  [Symbol.iterator](): Iterator<[string, string]>;
}

export type BaseFetcher = (
  url: string,
  // We explicitly do not allow you to pass in a Request object here, because
  // not all implementations recognize "foreign" Request objects.
  init?: FetcherRequestInit,
) => Promise<FetcherResponse>;

// Copy-pasta'd from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/1c864f0d125f04d205c92408bfd18d15ef616c08/types/node-fetch/externals.d.ts#L5
export interface AbortSignal {
  // Adding these makes things spec-compliant, but causes type errors for node-fetch
  // readonly reason: any;
  // throwIfAborted(): void;

  aborted: boolean;

  addEventListener: (
    type: "abort",
    listener: (this: AbortSignal, event: any) => any,
    options?:
      | boolean
      | {
          capture?: boolean | undefined;
          once?: boolean | undefined;
          passive?: boolean | undefined;
        },
  ) => void;

  removeEventListener: (
    type: "abort",
    listener: (this: AbortSignal, event: any) => any,
    options?:
      | boolean
      | {
          capture?: boolean | undefined;
        },
  ) => void;

  dispatchEvent: (event: any) => boolean;

  onabort: null | ((this: AbortSignal, event: any) => any);
}

// AbortSignal, but with modifications for Undici
export interface UndiciAbortSignal extends AbortSignal {
  aborted: boolean;

  // Additions to AbortSignal, which are spec-compliant. Adding these in the base
  // AbortSignal causes problems for node-fetch
  readonly reason: any;
  throwIfAborted(): void;

  addEventListener: (
    type: "abort",
    listener: (this: UndiciAbortSignal, event: any) => any,
    options?:
      | boolean
      | {
          // These params should be `param?: boolean | undefined` but that causes type errors
          // since Undici defines them like below. Adding this as a union to the existing AbortSignal.addEventListener
          // causes the compiler to get confused and choose the wrong type definition. See TypeScript docs on
          // `exactOptionalPropertyTypes` for more info https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes
          capture?: boolean;
          once?: boolean;
          passive?: boolean;
        },
  ) => void;

  removeEventListener: (
    type: "abort",
    listener: (this: UndiciAbortSignal, event: any) => any,
    options?:
      | boolean
      | {
          capture?: boolean;
        },
  ) => void;

  dispatchEvent: (event: any) => boolean;

  onabort: null | ((this: UndiciAbortSignal, event: any) => any);
}

export interface AbortableFetcherRequestInit extends FetcherRequestInit {
  signal?: AbortSignal & UndiciAbortSignal;
}

export type AbortableFetcher = (
  url: string,
  // We explicitly do not allow you to pass in a Request object here, because
  // not all implementations recognize "foreign" Request objects.
  init?: AbortableFetcherRequestInit,
) => Promise<FetcherResponse>;

export type Fetcher = BaseFetcher | AbortableFetcher;
