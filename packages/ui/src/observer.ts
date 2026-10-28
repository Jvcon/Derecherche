import { positionAtAnchor, type PositionOptions, type PositionResult } from "./position.js";

export interface ObserveOptions {
  window?: Window;
  resizeObserver?: boolean;
}

export interface TrackOptions extends PositionOptions, ObserveOptions {}

export function observeAnchor(
  anchor: Element | null,
  update: () => void,
  options: ObserveOptions = {}
): () => void {
  const win = options.window ?? window;
  const listener = () => update();

  win.addEventListener("scroll", listener, true);
  win.addEventListener("resize", listener);

  let observer: ResizeObserver | undefined;
  const ResizeObserverCtor = (
    win as unknown as { ResizeObserver?: typeof ResizeObserver }
  ).ResizeObserver;

  if (options.resizeObserver !== false && anchor && ResizeObserverCtor) {
    observer = new ResizeObserverCtor(listener);
    observer.observe(anchor);
  }

  return () => {
    win.removeEventListener("scroll", listener, true);
    win.removeEventListener("resize", listener);
    observer?.disconnect();
  };
}

export function trackAnchor(
  element: HTMLElement,
  anchor: Element | null,
  options: TrackOptions = {}
): () => void {
  const update = (): PositionResult | void => {
    if (!anchor) return;
    return positionAtAnchor(element, anchor, options);
  };

  update();
  return observeAnchor(anchor, update, options);
}
