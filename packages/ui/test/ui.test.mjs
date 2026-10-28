import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import {
  createShadowHost,
  observeAnchor,
  positionAroundRect,
  positionAtAnchor,
  positionFloating,
} from "../dist/index.js";

function rect(top, left, width, height) {
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

test("shadow host mounts isolated content and unmounts cleanly", () => {
  const window = new Window();
  const shadow = createShadowHost({
    id: "derecherche-test",
    document: window.document,
    css: ".surface { color: red; }",
  });

  assert.equal(shadow.isMounted(), false);
  shadow.mount(window.document.body);
  assert.equal(shadow.isMounted(), true);
  assert.equal(shadow.host.id, "derecherche-test");
  assert.ok(shadow.host.shadowRoot);
  assert.equal(shadow.shadowRoot?.querySelector("style")?.textContent.includes("all: initial"), true);
  assert.ok(shadow.shadowRoot?.querySelector("style")?.textContent.includes(".surface"));
  assert.equal(shadow.content.dataset.derechercheContent, "");

  shadow.mount(window.document.body);
  assert.equal(window.document.querySelectorAll("#derecherche-test").length, 1);

  shadow.unmount();
  assert.equal(shadow.isMounted(), false);
  assert.equal(window.document.querySelector("#derecherche-test"), null);
});

test("positionAroundRect places below and clamps to the viewport", () => {
  const position = positionAroundRect(rect(100, 100, 200, 20), {
    width: 300,
    height: 100,
  }, {
    viewport: { width: 1000, height: 800 },
    placement: "below",
    offset: 8,
    padding: 8,
  });

  assert.equal(position.placement, "below");
  assert.equal(position.top, 128);
  assert.equal(position.left, 100);
  assert.equal(position.maxWidth, 984);
});

test("positionAroundRect flips above near the bottom", () => {
  const position = positionAroundRect(rect(750, 900, 100, 20), {
    width: 300,
    height: 100,
  }, {
    viewport: { width: 1000, height: 800 },
    placement: "below",
    offset: 8,
    padding: 8,
  });

  assert.equal(position.placement, "above");
  assert.equal(position.top, 642);
  assert.equal(position.left, 692);
});

test("positionAtAnchor writes element styles", () => {
  const window = new Window();
  const element = window.document.createElement("div");
  const anchor = {
    getBoundingClientRect: () => rect(100, 100, 200, 20),
  };

  const position = positionAtAnchor(element, anchor, {
    viewport: { width: 1000, height: 800 },
    size: { width: 300, height: 100 },
    placement: "below",
  });

  assert.equal(position.top, 128);
  assert.equal(element.style.top, "128px");
  assert.equal(element.style.left, "100px");
  assert.equal(element.style.maxWidth, "984px");
});

test("positionFloating anchors to the bottom right", () => {
  const window = new Window();
  const element = window.document.createElement("div");
  const position = positionFloating(element, {
    viewport: { width: 1000, height: 800 },
    size: { width: 300, height: 100 },
    padding: 8,
  });

  assert.equal(position.left, 692);
  assert.equal(position.top, 692);
  assert.equal(element.style.left, "692px");
  assert.equal(element.style.top, "692px");
});

test("observeAnchor updates on scroll/resize and cleans up", () => {
  const window = new Window();
  const element = window.document.createElement("div");
  const anchor = {
    getBoundingClientRect: () => rect(100, 100, 200, 20),
  };

  let updates = 0;
  const cleanup = observeAnchor(anchor, () => {
    updates += 1;
  }, { window, resizeObserver: false });

  window.dispatchEvent(new window.Event("scroll"));
  window.dispatchEvent(new window.Event("resize"));
  assert.equal(updates, 2);

  cleanup();
  window.dispatchEvent(new window.Event("scroll"));
  assert.equal(updates, 2);
  void element;
});
