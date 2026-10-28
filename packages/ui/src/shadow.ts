const BASE_CSS = `
:host {
  all: initial;
  position: fixed;
  inset: auto;
  z-index: var(--derecherche-z-index, 2147483647);
  color-scheme: light dark;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.4;
  contain: layout style;
  --dr-bg: #ffffff;
  --dr-fg: #1f2328;
  --dr-muted: #656d76;
  --dr-border: #d0d7de;
  --dr-hover: #f3f4f6;
  --dr-accent: #0969da;
  --dr-shadow: 0 8px 24px rgba(31, 35, 40, 0.16);
  --dr-radius: 10px;
}
:host, :host * {
  box-sizing: border-box;
}
[hidden] {
  display: none !important;
}
@media (prefers-color-scheme: dark) {
  :host {
    --dr-bg: #1f2328;
    --dr-fg: #e6edf3;
    --dr-muted: #8b949e;
    --dr-border: #30363d;
    --dr-hover: #2d333b;
    --dr-accent: #4493f8;
    --dr-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
`;

export interface ShadowHostOptions {
  id: string;
  css?: string;
  document?: Document;
  zIndex?: number;
}

export interface ShadowHost {
  host: HTMLElement;
  shadowRoot: ShadowRoot;
  content: HTMLElement;
  mount(parent?: HTMLElement): void;
  unmount(): void;
  isMounted(): boolean;
}

export function createShadowHost(options: ShadowHostOptions): ShadowHost {
  const doc = options.document ?? document;
  const host = doc.createElement("div");
  host.id = options.id;
  host.dataset.derechercheHost = "";

  if (options.zIndex !== undefined) {
    host.style.setProperty("--derecherche-z-index", String(options.zIndex));
  }

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = doc.createElement("style");
  style.textContent = `${BASE_CSS}\n${options.css ?? ""}`;

  const content = doc.createElement("div");
  content.dataset.derechercheContent = "";

  shadowRoot.append(style, content);

  return {
    host,
    shadowRoot,
    content,
    mount(parent = doc.body) {
      if (!host.isConnected) parent.append(host);
    },
    unmount() {
      host.remove();
    },
    isMounted() {
      return host.isConnected;
    },
  };
}
