export type Placement = "above" | "below";

export interface RectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ViewportLike {
  width: number;
  height: number;
}

export interface SizeLike {
  width: number;
  height: number;
}

export interface PositionOptions {
  placement?: Placement;
  offset?: number;
  padding?: number;
  viewport?: ViewportLike;
  size?: SizeLike;
}

export interface PositionResult {
  left: number;
  top: number;
  placement: Placement;
  maxWidth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function getViewport(win: Window = window): ViewportLike {
  const doc = win.document.documentElement;
  return {
    width: win.innerWidth || doc.clientWidth || 0,
    height: win.innerHeight || doc.clientHeight || 0,
  };
}

function elementSize(element: HTMLElement): SizeLike {
  return {
    width: element.getBoundingClientRect().width || element.offsetWidth || 0,
    height: element.getBoundingClientRect().height || element.offsetHeight || 0,
  };
}

export function positionAroundRect(
  anchor: RectLike,
  element: SizeLike,
  options: PositionOptions = {}
): PositionResult {
  const viewport = options.viewport ?? getViewport();
  const offset = options.offset ?? 8;
  const padding = options.padding ?? 8;
  const maxWidth = Math.max(0, viewport.width - padding * 2);
  const width = Math.min(element.width, maxWidth);

  const left = clamp(
    anchor.left,
    padding,
    viewport.width - width - padding
  );

  const spaceBelow = viewport.height - anchor.bottom - padding;
  const spaceAbove = anchor.top - padding;
  let placement: Placement =
    options.placement ??
    (spaceBelow >= element.height + offset || spaceBelow >= spaceAbove
      ? "below"
      : "above");

  if (
    placement === "below" &&
    spaceBelow < element.height + offset &&
    spaceAbove > spaceBelow
  ) {
    placement = "above";
  } else if (
    placement === "above" &&
    spaceAbove < element.height + offset &&
    spaceBelow > spaceAbove
  ) {
    placement = "below";
  }

  const desiredTop =
    placement === "below"
      ? anchor.bottom + offset
      : anchor.top - element.height - offset;

  return {
    left,
    top: clamp(
      desiredTop,
      padding,
      viewport.height - element.height - padding
    ),
    placement,
    maxWidth,
  };
}

export function applyPosition(
  element: HTMLElement,
  position: PositionResult
): void {
  element.style.left = `${Math.round(position.left)}px`;
  element.style.top = `${Math.round(position.top)}px`;
  element.style.maxWidth = `${Math.round(position.maxWidth)}px`;
}

export function positionAtAnchor(
  element: HTMLElement,
  anchor: Element,
  options: PositionOptions = {}
): PositionResult {
  const position = positionAroundRect(
    anchor.getBoundingClientRect(),
    options.size ?? elementSize(element),
    options
  );
  applyPosition(element, position);
  return position;
}

export function positionFloating(
  element: HTMLElement,
  options: PositionOptions = {}
): PositionResult {
  const viewport = options.viewport ?? getViewport();
  const padding = options.padding ?? 8;
  const size = options.size ?? elementSize(element);
  const maxWidth = Math.max(0, viewport.width - padding * 2);
  const width = Math.min(size.width, maxWidth);
  const position: PositionResult = {
    left: clamp(
      viewport.width - width - padding,
      padding,
      viewport.width - width - padding
    ),
    top: clamp(
      viewport.height - size.height - padding,
      padding,
      viewport.height - size.height - padding
    ),
    placement: "below",
    maxWidth,
  };
  applyPosition(element, position);
  return position;
}
