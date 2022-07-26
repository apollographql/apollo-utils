/*

START CUSTOMIZATIONS

*/

interface AddEventListenerOptionsNodeFetch {
  capture?: boolean | undefined;
  once?: boolean | undefined;
  passive?: boolean | undefined;
  signal?: AbortSignal;
}

interface AddEventListenerOptionsUndici {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L1916-L1918
/** A signal object that allows you to communicate with a DOM request (such as a Fetch) and abort it if required via an AbortController object. */
// prettier-ignore
export interface AbortSignalWithNodeFetchOptions extends EventTarget {
  /**
   * Returns true if this AbortSignal's AbortController has signaled to abort, and false otherwise.
   */
  readonly aborted: boolean;
  onabort: ((this: AbortSignal, ev: Event) => any) | null;
  addEventListener<K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions | AddEventListenerOptionsNodeFetch | AddEventListenerOptionsUndici): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions | AddEventListenerOptionsNodeFetch | AddEventListenerOptionsUndici): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

// prettier-ignore
export interface AbortSignalUndici extends AbortSignalWithNodeFetchOptions {
  readonly reason: any;
  throwIfAborted(): void;
}

export type AbortSignal = AbortSignalWithNodeFetchOptions | AbortSignalUndici;

/*

END CUSTOMIZATIONS

*/

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L449-L451
export interface EventListenerOptions {
  capture?: boolean;
}

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L25-L29
interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L1916-L1918
interface AbortSignalEventMap {
  abort: Event;
}

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L5113-L5119
interface EventListener {
  (evt: Event): void;
}

interface EventListenerObject {
  handleEvent(object: Event): void;
}

type EventListenerOrEventListenerObject = EventListener | EventListenerObject;
type DOMHighResTimeStamp = number;

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L5033-L5102
// prettier-ignore
/** An event which takes place in the DOM. */
interface Event {
  /**
   * Returns true or false depending on how event was initialized. True if event goes through its target's ancestors in reverse tree order, and false otherwise.
   */
  readonly bubbles: boolean;
  cancelBubble: boolean;
  /**
   * Returns true or false depending on how event was initialized. Its return value does not always carry meaning, but true can indicate that part of the operation during which event was dispatched, can be canceled by invoking the preventDefault() method.
   */
  readonly cancelable: boolean;
  /**
   * Returns true or false depending on how event was initialized. True if event invokes listeners past a ShadowRoot node that is the root of its target, and false otherwise.
   */
  readonly composed: boolean;
  /**
   * Returns the object whose event listener's callback is currently being invoked.
   */
  readonly currentTarget: EventTarget | null;
  /**
   * Returns true if preventDefault() was invoked successfully to indicate cancelation, and false otherwise.
   */
  readonly defaultPrevented: boolean;
  /**
   * Returns the event's phase, which is one of NONE, CAPTURING_PHASE, AT_TARGET, and BUBBLING_PHASE.
   */
  readonly eventPhase: number;
  /**
   * Returns true if event was dispatched by the user agent, and false otherwise.
   */
  readonly isTrusted: boolean;
  /** @deprecated */
  returnValue: boolean;
  /** @deprecated */
  readonly srcElement: EventTarget | null;
  /**
   * Returns the object to which event is dispatched (its target).
   */
  readonly target: EventTarget | null;
  /**
   * Returns the event's timestamp as the number of milliseconds measured relative to the time origin.
   */
  readonly timeStamp: DOMHighResTimeStamp;
  /**
   * Returns the type of event, e.g. "click", "hashchange", or "submit".
   */
  readonly type: string;
  /**
   * Returns the invocation target objects of event's path (objects on which listeners will be invoked), except for any nodes in shadow trees of which the shadow root's mode is "closed" that are not reachable from event's currentTarget.
   */
  composedPath(): EventTarget[];
  /** @deprecated */
  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
  /**
   * If invoked when the cancelable attribute value is true, and while executing a listener for the event with passive set to false, signals to the operation that caused event to be dispatched that it needs to be canceled.
   */
  preventDefault(): void;
  /**
   * Invoking this method prevents event from reaching any registered event listeners after the current one finishes running and, when dispatched in a tree, also prevents event from reaching any other objects.
   */
  stopImmediatePropagation(): void;
  /**
   * When dispatched in a tree, invoking this method prevents event from reaching any objects other than the current object.
   */
  stopPropagation(): void;
  readonly AT_TARGET: number;
  readonly BUBBLING_PHASE: number;
  readonly CAPTURING_PHASE: number;
  readonly NONE: number;
}

// https://github.com/microsoft/TypeScript/blob/78e2bfd7126353a12b2c559ca1bcf441431d86b0/lib/lib.dom.d.ts#L5164-L5190
// prettier-ignore
/** EventTarget is a DOM interface implemented by objects that can receive events and may have listeners for them. */
interface EventTarget {
  /**
   * Appends an event listener for events whose type attribute value is type. The callback argument sets the callback that will be invoked when the event is dispatched.
   *
   * The options argument sets listener-specific options. For compatibility this can be a boolean, in which case the method behaves exactly as if the value was specified as options's capture.
   *
   * When set to true, options's capture prevents callback from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE. When false (or not present), callback will not be invoked when event's eventPhase attribute value is CAPTURING_PHASE. Either way, callback will be invoked if event's eventPhase attribute value is AT_TARGET.
   *
   * When set to true, options's passive indicates that the callback will not cancel the event by invoking preventDefault(). This is used to enable performance optimizations described in § 2.8 Observing event listeners.
   *
   * When set to true, options's once indicates that the callback will only be invoked once after which the event listener will be removed.
   *
   * If an AbortSignal is passed for options's signal, then the event listener will be removed when signal is aborted.
   *
   * The event listener is appended to target's event listener list and is not appended if it has the same type, callback, and capture.
   */
  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
  /**
   * Dispatches a synthetic event event to target and returns true if either event's cancelable attribute value is false or its preventDefault() method was not invoked, and false otherwise.
   */
  dispatchEvent(event: Event): boolean;
  /**
   * Removes the event listener in target's event listener list with the same type, callback, and options.
   */
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
}
