"use strict";
var LiveMotion = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // js/live_pane/index.ts
  var live_pane_exports = {};
  __export(live_pane_exports, {
    createLivePaneHooks: () => createLivePaneHooks
  });

  // js/live_pane/utils.ts
  function assert(expectedCondition, message = "Assertion failed!") {
    if (!expectedCondition) {
      console.error(message);
      throw Error(message);
    }
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a && typeof a === "object" || typeof a === "function";
  }
  function isHTMLElement(element) {
    return element instanceof HTMLElement;
  }
  function isMouseEvent(event) {
    return event.type.startsWith("mouse");
  }
  function isTouchEvent(event) {
    return event.type.startsWith("touch");
  }
  function isKeyDown(event) {
    return event.type === "keydown";
  }
  function paneDataHelper(paneDataArray, paneData, layout) {
    const paneConstraintsArray = paneDataArray.map(
      (paneData2) => paneData2.constraints
    );
    const paneIndex = findPaneDataIndex(paneDataArray, paneData.id);
    const paneConstraints = paneConstraintsArray[paneIndex];
    const isLastPane = paneIndex === paneDataArray.length - 1;
    const pivotIndices = isLastPane ? [paneIndex - 1, paneIndex] : [paneIndex, paneIndex + 1];
    const paneSize = layout[paneIndex];
    return __spreadProps(__spreadValues({}, paneConstraints), {
      paneSize,
      pivotIndices
    });
  }
  function findPaneDataIndex(paneDataArray, paneDataId) {
    return paneDataArray.findIndex((p) => p.id === paneDataId);
  }
  function isPaneCollapsed(paneDataArray, layout, pane) {
    const {
      collapsedSize = 0,
      collapsible,
      paneSize
    } = paneDataHelper(paneDataArray, pane, layout);
    return collapsible === true && paneSize === collapsedSize;
  }
  function isPaneExpanded(paneDataArray, layout, pane) {
    const {
      collapsedSize = 0,
      collapsible,
      paneSize
    } = paneDataHelper(paneDataArray, pane, layout);
    return !collapsible || paneSize > collapsedSize;
  }
  function tick() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  // js/live_pane/store.ts
  function writable(value) {
    const subscribers = /* @__PURE__ */ new Set();
    function set(new_value) {
      if (safe_not_equal(value, new_value)) {
        value = new_value;
        for (const subscriber of subscribers) {
          subscriber(new_value);
        }
      }
    }
    function get() {
      return value;
    }
    function update(fn) {
      set(fn(value));
    }
    function subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(value);
      return () => {
        subscribers.delete(subscriber);
      };
    }
    return { set, get, update, subscribe };
  }

  // js/live_pane/storage.ts
  function initializeStorage(storageObject) {
    try {
      if (typeof localStorage === "undefined") {
        throw new Error("localStorage is not supported in this environment");
      }
      storageObject.getItem = (name) => localStorage.getItem(name);
      storageObject.setItem = (name, value) => localStorage.setItem(name, value);
    } catch (err) {
      console.error(err);
      storageObject.getItem = () => null;
      storageObject.setItem = () => {
      };
    }
  }
  function savePaneGroupState(autoSaveId, panes, paneSizesBeforeCollapse, sizes, storage) {
    const paneGroupKey = getPaneGroupKey(autoSaveId);
    const paneKey = getPaneKey(panes);
    const state = loadSerializedPaneGroupState(autoSaveId, storage) || {};
    state[paneKey] = {
      expandToSizes: Object.fromEntries(paneSizesBeforeCollapse.entries()),
      layout: sizes
    };
    try {
      storage.setItem(paneGroupKey, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }
  function loadPaneGroupState(autoSaveId, panes, storage) {
    const state = loadSerializedPaneGroupState(autoSaveId, storage) || {};
    const paneKey = getPaneKey(panes);
    return state[paneKey] || null;
  }
  function getPaneGroupKey(id) {
    return `livepane:${id}`;
  }
  function getPaneKey(panes) {
    const sortedPaneIds = panes.map(({ id }) => id).sort().join(",");
    return sortedPaneIds;
  }
  function loadSerializedPaneGroupState(autoSaveId, storage) {
    try {
      const paneGroupKey = getPaneGroupKey(autoSaveId);
      const serialized = storage.getItem(paneGroupKey);
      const parsed = JSON.parse(serialized || "");
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    } catch (e) {
    }
    return null;
  }
  var debounceMap = {};
  function debounce(callback, durationMs = 10) {
    let timeoutId = null;
    const callable = (...args) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        callback(...args);
      }, durationMs);
    };
    return callable;
  }
  function updateStorageValues({
    saveId,
    layout,
    storage,
    paneDataArrayStore,
    paneSizeBeforeCollapseStore
  }) {
    const $paneDataArray = paneDataArrayStore.get();
    if (layout.length === 0 || layout.length !== $paneDataArray.length)
      return;
    let debouncedSave = debounceMap[saveId];
    if (debouncedSave == null) {
      debouncedSave = debounce(
        savePaneGroupState,
        LOCAL_STORAGE_DEBOUNCE_INTERVAL
      );
      debounceMap[saveId] = debouncedSave;
    }
    const clonedPaneDataArray = [...$paneDataArray];
    const $paneSizeBeforeCollapse = paneSizeBeforeCollapseStore.get();
    const clonedPaneSizesBeforeCollapse = new Map($paneSizeBeforeCollapse);
    debouncedSave(
      saveId,
      clonedPaneDataArray,
      clonedPaneSizesBeforeCollapse,
      layout,
      storage
    );
  }

  // js/live_pane/core.ts
  var LOCAL_STORAGE_DEBOUNCE_INTERVAL = 100;
  var PRECISION = 10;
  var paneGroupInstances = /* @__PURE__ */ new Map();
  var paneInstances = /* @__PURE__ */ new Map();
  var resizerInstances = /* @__PURE__ */ new Map();
  var dragState = writable(null);
  var defaultStorage = {
    getItem: (name) => {
      initializeStorage(defaultStorage);
      return defaultStorage.getItem(name);
    },
    setItem: (name, value) => {
      initializeStorage(defaultStorage);
      defaultStorage.setItem(name, value);
    }
  };

  // js/live_pane/compare.ts
  function areNumbersAlmostEqual(actual, expected, fractionDigits = PRECISION) {
    return compareNumbersWithTolerance(actual, expected, fractionDigits) === 0;
  }
  function compareNumbersWithTolerance(actual, expected, fractionDigits = PRECISION) {
    const roundedActual = roundTo(actual, fractionDigits);
    const roundedExpected = roundTo(expected, fractionDigits);
    return Math.sign(roundedActual - roundedExpected);
  }
  function areArraysEqual(arrA, arrB) {
    if (arrA.length !== arrB.length)
      return false;
    for (let index = 0; index < arrA.length; index++) {
      if (arrA[index] !== arrB[index])
        return false;
    }
    return true;
  }
  function roundTo(value, decimals) {
    return parseFloat(value.toFixed(decimals));
  }

  // js/live_pane/resize.ts
  function resizePane({
    paneConstraintsArray: constraints,
    paneIndex,
    size
  }) {
    assert(
      constraints[paneIndex] != null,
      "Pane constraints should not be null."
    );
    const { collapsedSize, collapsible, maxSize, minSize } = constraints[paneIndex];
    let newSize = size;
    if (compareNumbersWithTolerance(newSize, minSize) < 0) {
      newSize = getAdjustedSizeForCollapsible(
        newSize,
        collapsible,
        collapsedSize,
        minSize
      );
    }
    newSize = Math.min(maxSize, newSize);
    return parseFloat(newSize.toFixed(PRECISION));
  }
  function getAdjustedSizeForCollapsible(size, collapsible, collapsedSize, minSize) {
    if (!collapsible)
      return minSize;
    const halfwayPoint = (collapsedSize + minSize) / 2;
    return compareNumbersWithTolerance(size, halfwayPoint) < 0 ? collapsedSize : minSize;
  }

  // js/live_pane/aria.ts
  function calculateAriaValues({
    layout,
    panesArray,
    pivotIndices
  }) {
    let currentMinSize = 0;
    let currentMaxSize = 100;
    let totalMinSize = 0;
    let totalMaxSize = 0;
    const firstIndex = pivotIndices[0];
    for (let i = 0; i < panesArray.length; i++) {
      const { constraints } = panesArray[i];
      const { maxSize = 100, minSize = 0 } = constraints;
      if (i === firstIndex) {
        currentMinSize = minSize;
        currentMaxSize = maxSize;
      } else {
        totalMinSize += minSize;
        totalMaxSize += maxSize;
      }
    }
    const valueMax = Math.min(currentMaxSize, 100 - totalMinSize);
    const valueMin = Math.max(currentMinSize, 100 - totalMaxSize);
    const valueNow = layout[firstIndex];
    return {
      valueMax,
      valueMin,
      valueNow
    };
  }

  // js/live_pane/hooks/group.ts
  function createGroupHook() {
    let groupHook = {
      mounted() {
        if (!this.el.id) {
          throw Error("Pane Group must have an id.");
        }
        if (paneGroupInstances.has(this.el.id)) {
          throw Error(`Pane Group with id "${this.el.id}" already exists.`);
        }
        const dir = this.el.getAttribute("data-pane-direction") || "horizontal";
        const keyboardResizeByAttr = this.el.getAttribute("keyboard-resize-by");
        const keyboardResizeBy = keyboardResizeByAttr ? Number(keyboardResizeByAttr) : null;
        const autoSave = this.el.getAttribute("auto-save") === "true";
        const paneDataArray = writable([]);
        const paneDataArrayChanged = writable(false);
        const direction = writable(dir);
        const layout = writable([]);
        const prevDelta = writable(0);
        const paneIdToLastNotifiedSizeMap = {};
        const paneSizeBeforeCollapseMap = writable(
          /* @__PURE__ */ new Map()
        );
        const unsubFromPaneDataChange = updateLayoutOnPaneDataChange(
          this.el.id,
          layout,
          paneDataArray,
          paneDataArrayChanged,
          autoSave,
          paneSizeBeforeCollapseMap
        );
        const unsubFromLayoutChange = saveStateOnLayoutChange(
          this.el.id,
          layout,
          paneDataArray,
          paneSizeBeforeCollapseMap,
          autoSave
        );
        const unsubFromUpdateAriaValues = updateResizeHandleAriaValuesOnLayoutChange(
          this.el.id,
          layout,
          paneDataArray
        );
        const unsubFromUpdateIsCollapsed = updateIsCollapsedOnLayoutChange(
          layout,
          paneDataArray
        );
        const groupData = {
          paneDataArray,
          paneDataArrayChanged,
          direction,
          layout,
          prevDelta,
          keyboardResizeBy,
          paneIdToLastNotifiedSizeMap,
          paneSizeBeforeCollapseMap,
          autoSave,
          unsubFromPaneDataChange,
          unsubFromLayoutChange,
          unsubFromUpdateAriaValues,
          unsubFromUpdateIsCollapsed
        };
        paneGroupInstances.set(this.el.id, groupData);
      },
      destroyed() {
        var _a, _b, _c, _d;
        (_a = paneGroupInstances.get(this.el.id)) == null ? void 0 : _a.unsubFromUpdateIsCollapsed();
        (_b = paneGroupInstances.get(this.el.id)) == null ? void 0 : _b.unsubFromPaneDataChange();
        (_c = paneGroupInstances.get(this.el.id)) == null ? void 0 : _c.unsubFromLayoutChange();
        (_d = paneGroupInstances.get(this.el.id)) == null ? void 0 : _d.unsubFromUpdateAriaValues();
        paneGroupInstances.delete(this.el.id);
      }
    };
    return groupHook;
  }
  function saveStateOnLayoutChange(groupId, layout, paneDataArray, paneSizeBeforeCollapseMap, autoSave = false, storage = defaultStorage) {
    return layout.subscribe((layout2) => {
      if (!autoSave)
        return;
      updateStorageValues({
        saveId: groupId,
        layout: layout2,
        storage,
        paneDataArrayStore: paneDataArray,
        paneSizeBeforeCollapseStore: paneSizeBeforeCollapseMap
      });
    });
  }
  function updateLayoutOnPaneDataChange(groupId, layout, paneDataArray, paneDataArrayChanged, autoSave = false, paneSizeBeforeCollapseMap) {
    return paneDataArrayChanged.subscribe((changed) => {
      if (!changed)
        return;
      paneDataArrayChanged.set(false);
      const $prevLayout = layout.get();
      const $paneDataArray = paneDataArray.get();
      let unsafeLayout = null;
      if (autoSave) {
        const state = loadPaneGroupState(groupId, $paneDataArray, defaultStorage);
        if (state) {
          paneSizeBeforeCollapseMap.set(
            new Map(Object.entries(state.expandToSizes))
          );
          unsafeLayout = state.layout;
        }
      }
      if (unsafeLayout == null) {
        unsafeLayout = getUnsafeDefaultLayout({
          paneDataArray: $paneDataArray
        });
      }
      const nextLayout = validatePaneGroupLayout({
        layout: unsafeLayout,
        paneConstraintsArray: $paneDataArray.map((paneData) => paneData.constraints)
      });
      if (areArraysEqual($prevLayout, nextLayout))
        return;
      layout.set(nextLayout);
    });
  }
  function updateIsCollapsedOnLayoutChange(layout, paneDataArray) {
    return layout.subscribe((changedLayout) => {
      const paneDatas = paneDataArray.get();
      for (let index = 0; index <= paneDatas.length - 1; index++) {
        const paneData = paneDatas[index];
        const isCollapsed = isPaneCollapsed(paneDatas, changedLayout, paneData);
        if (isCollapsed && paneData.state.get() !== "collapsing" /* Collapsing */) {
          paneData.state.set("collapsed" /* Collapsed */);
          continue;
        }
        const isExpanded = isPaneExpanded(paneDatas, changedLayout, paneData);
        if (isExpanded && paneData.state.get() !== "expanding" /* Expanding */) {
          paneData.state.set("expanded" /* Expanded */);
        }
      }
    });
  }
  function updateResizeHandleAriaValuesOnLayoutChange(groupId, layout, paneDataArray) {
    return layout.subscribe((currentLayout) => {
      const resizeHandleElements = getResizeHandleElementsForGroup(groupId);
      const paneDatas = paneDataArray.get();
      for (let index = 0; index < paneDatas.length - 1; index++) {
        const { valueMax, valueMin, valueNow } = calculateAriaValues({
          layout: currentLayout,
          panesArray: paneDatas,
          pivotIndices: [index, index + 1]
        });
        const resizeHandleEl = resizeHandleElements[index];
        if (isHTMLElement(resizeHandleEl)) {
          const paneData = paneDatas[index];
          resizeHandleEl.setAttribute("aria-controls", paneData.id);
          resizeHandleEl.setAttribute("aria-valuemax", "" + Math.round(valueMax));
          resizeHandleEl.setAttribute("aria-valuemin", "" + Math.round(valueMin));
          resizeHandleEl.setAttribute(
            "aria-valuenow",
            valueNow != null ? "" + Math.round(valueNow) : ""
          );
        }
      }
    });
  }
  function getUnsafeDefaultLayout({
    paneDataArray
  }) {
    const layout = Array(paneDataArray.length);
    const paneConstraintsArray = paneDataArray.map(
      (paneData) => paneData.constraints
    );
    let numPanesWithSizes = 0;
    let remainingSize = 100;
    for (let index = 0; index < paneDataArray.length; index++) {
      const paneConstraints = paneConstraintsArray[index];
      assert(paneConstraints);
      const { defaultSize } = paneConstraints;
      if (defaultSize != null) {
        numPanesWithSizes++;
        layout[index] = defaultSize;
        remainingSize -= defaultSize;
      }
    }
    for (let index = 0; index < paneDataArray.length; index++) {
      const paneConstraints = paneConstraintsArray[index];
      assert(paneConstraints);
      const { defaultSize } = paneConstraints;
      if (defaultSize != null) {
        continue;
      }
      const numRemainingPanes = paneDataArray.length - numPanesWithSizes;
      const size = remainingSize / numRemainingPanes;
      numPanesWithSizes++;
      layout[index] = size;
      remainingSize -= size;
    }
    return layout;
  }
  function validatePaneGroupLayout({
    layout: prevLayout,
    paneConstraintsArray
  }) {
    const nextLayout = [...prevLayout];
    const nextLayoutTotalSize = nextLayout.reduce(
      (accumulated, current) => accumulated + current,
      0
    );
    if (nextLayout.length !== paneConstraintsArray.length) {
      throw Error(
        `Invalid ${paneConstraintsArray.length} pane layout: ${nextLayout.map((size) => `${size}%`).join(", ")}`
      );
    } else if (!areNumbersAlmostEqual(nextLayoutTotalSize, 100)) {
      for (let index = 0; index < paneConstraintsArray.length; index++) {
        const unsafeSize = nextLayout[index];
        assert(unsafeSize != null);
        const safeSize = 100 / nextLayoutTotalSize * unsafeSize;
        nextLayout[index] = safeSize;
      }
    }
    let remainingSize = 0;
    for (let index = 0; index < paneConstraintsArray.length; index++) {
      const unsafeSize = nextLayout[index];
      assert(unsafeSize != null);
      const safeSize = resizePane({
        paneConstraintsArray,
        paneIndex: index,
        size: unsafeSize
      });
      if (unsafeSize != safeSize) {
        remainingSize += unsafeSize - safeSize;
        nextLayout[index] = safeSize;
      }
    }
    if (!areNumbersAlmostEqual(remainingSize, 0)) {
      for (let index = 0; index < paneConstraintsArray.length; index++) {
        const prevSize = nextLayout[index];
        assert(prevSize != null);
        const unsafeSize = prevSize + remainingSize;
        const safeSize = resizePane({
          paneConstraintsArray,
          paneIndex: index,
          size: unsafeSize
        });
        if (prevSize !== safeSize) {
          remainingSize -= safeSize - prevSize;
          nextLayout[index] = safeSize;
          if (areNumbersAlmostEqual(remainingSize, 0)) {
            break;
          }
        }
      }
    }
    return nextLayout;
  }
  function getResizeHandleElementsForGroup(groupId) {
    return Array.from(
      document.querySelectorAll(
        `[data-pane-resizer-id][data-pane-group-id="${groupId}"]`
      )
    );
  }

  // js/live_pane/style.ts
  function styleToString(style) {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === void 0)
        return str;
      return str + `${key}:${style[key]};`;
    }, "");
  }
  var currentState = null;
  function getCursorStyle(state) {
    switch (state) {
      case "horizontal":
        return "ew-resize";
      case "horizontal-max":
        return "w-resize";
      case "horizontal-min":
        return "e-resize";
      case "vertical":
        return "ns-resize";
      case "vertical-max":
        return "n-resize";
      case "vertical-min":
        return "s-resize";
    }
  }
  function resetGlobalCursorStyle() {
    if (!currentState)
      return;
    document.documentElement.style.cursor = "";
    currentState = null;
  }
  function setGlobalCursorStyle(state) {
    if (currentState === state)
      return;
    const root = document.documentElement;
    if (currentState) {
      root.style.cursor = "";
    }
    root.style.cursor = getCursorStyle(state);
    currentState = state;
  }
  function computePaneFlexBoxStyle({
    defaultSize,
    dragState: dragState2,
    layout,
    paneData,
    paneIndex,
    precision = 3
  }) {
    const size = layout[paneIndex];
    let flexGrow;
    if (size == null) {
      flexGrow = defaultSize != null ? defaultSize : "1";
    } else if (paneData.length === 1) {
      flexGrow = "1";
    } else {
      flexGrow = size.toPrecision(precision);
    }
    return styleToString({
      "flex-basis": 0,
      "flex-grow": flexGrow,
      "flex-shrink": 1,
      // Without this, pane sizes may be unintentionally overridden by their content
      overflow: "hidden",
      // Disable pointer events inside of a pane during resize
      // This avoid edge cases like nested iframes
      "pointer-events": dragState2 !== null ? "none" : void 0
    });
  }

  // js/live_pane/adjust-layout.ts
  function adjustLayoutByDelta({
    delta,
    layout: prevLayout,
    paneConstraintsArray,
    pivotIndices,
    trigger
  }) {
    if (areNumbersAlmostEqual(delta, 0))
      return prevLayout;
    const nextLayout = [...prevLayout];
    const [firstPivotIndex, secondPivotIndex] = pivotIndices;
    assert(firstPivotIndex != null, "Invalid first pivot index");
    assert(secondPivotIndex != null, "Invalid second pivot index");
    let deltaApplied = 0;
    {
      if (trigger === "keyboard") {
        {
          const index = delta < 0 ? secondPivotIndex : firstPivotIndex;
          const paneConstraints = paneConstraintsArray[index];
          assert(paneConstraints);
          if (paneConstraints.collapsible) {
            const prevSize = prevLayout[index];
            assert(prevSize != null);
            const paneConstraints2 = paneConstraintsArray[index];
            assert(paneConstraints2);
            const { collapsedSize = 0, minSize = 0 } = paneConstraints2;
            if (areNumbersAlmostEqual(prevSize, collapsedSize)) {
              const localDelta = minSize - prevSize;
              if (compareNumbersWithTolerance(localDelta, Math.abs(delta)) > 0) {
                delta = delta < 0 ? 0 - localDelta : localDelta;
              }
            }
          }
        }
        {
          const index = delta < 0 ? firstPivotIndex : secondPivotIndex;
          const paneConstraints = paneConstraintsArray[index];
          assert(paneConstraints);
          const { collapsible } = paneConstraints;
          if (collapsible) {
            const prevSize = prevLayout[index];
            assert(prevSize != null);
            const paneConstraints2 = paneConstraintsArray[index];
            assert(paneConstraints2);
            const { collapsedSize = 0, minSize = 0 } = paneConstraints2;
            if (areNumbersAlmostEqual(prevSize, minSize)) {
              const localDelta = prevSize - collapsedSize;
              if (compareNumbersWithTolerance(localDelta, Math.abs(delta)) > 0) {
                delta = delta < 0 ? 0 - localDelta : localDelta;
              }
            }
          }
        }
      }
    }
    {
      const increment = delta < 0 ? 1 : -1;
      let index = delta < 0 ? secondPivotIndex : firstPivotIndex;
      let maxAvailableDelta = 0;
      while (true) {
        const prevSize = prevLayout[index];
        assert(prevSize != null);
        const maxSafeSize = resizePane({
          paneConstraintsArray,
          paneIndex: index,
          size: 100
        });
        const delta2 = maxSafeSize - prevSize;
        maxAvailableDelta += delta2;
        index += increment;
        if (index < 0 || index >= paneConstraintsArray.length) {
          break;
        }
      }
      const minAbsDelta = Math.min(Math.abs(delta), Math.abs(maxAvailableDelta));
      delta = delta < 0 ? 0 - minAbsDelta : minAbsDelta;
    }
    {
      const pivotIndex = delta < 0 ? firstPivotIndex : secondPivotIndex;
      let index = pivotIndex;
      while (index >= 0 && index < paneConstraintsArray.length) {
        const deltaRemaining = Math.abs(delta) - Math.abs(deltaApplied);
        const prevSize = prevLayout[index];
        assert(prevSize != null);
        const unsafeSize = prevSize - deltaRemaining;
        const safeSize = resizePane({
          paneConstraintsArray,
          paneIndex: index,
          size: unsafeSize
        });
        if (!areNumbersAlmostEqual(prevSize, safeSize)) {
          deltaApplied += prevSize - safeSize;
          nextLayout[index] = safeSize;
          if (deltaApplied.toPrecision(3).localeCompare(Math.abs(delta).toPrecision(3), void 0, {
            numeric: true
          }) >= 0) {
            break;
          }
        }
        if (delta < 0) {
          index--;
        } else {
          index++;
        }
      }
    }
    if (areNumbersAlmostEqual(deltaApplied, 0)) {
      return prevLayout;
    }
    {
      const pivotIndex = delta < 0 ? secondPivotIndex : firstPivotIndex;
      const prevSize = prevLayout[pivotIndex];
      assert(prevSize != null);
      const unsafeSize = prevSize + deltaApplied;
      const safeSize = resizePane({
        paneConstraintsArray,
        paneIndex: pivotIndex,
        size: unsafeSize
      });
      nextLayout[pivotIndex] = safeSize;
      if (!areNumbersAlmostEqual(safeSize, unsafeSize)) {
        let deltaRemaining = unsafeSize - safeSize;
        const pivotIndex2 = delta < 0 ? secondPivotIndex : firstPivotIndex;
        let index = pivotIndex2;
        while (index >= 0 && index < paneConstraintsArray.length) {
          const prevSize2 = nextLayout[index];
          assert(prevSize2 != null);
          const unsafeSize2 = prevSize2 + deltaRemaining;
          const safeSize2 = resizePane({
            paneConstraintsArray,
            paneIndex: index,
            size: unsafeSize2
          });
          if (!areNumbersAlmostEqual(prevSize2, safeSize2)) {
            deltaRemaining -= safeSize2 - prevSize2;
            nextLayout[index] = safeSize2;
          }
          if (areNumbersAlmostEqual(deltaRemaining, 0))
            break;
          delta > 0 ? index-- : index++;
        }
      }
    }
    const totalSize = nextLayout.reduce((total, size) => size + total, 0);
    if (!areNumbersAlmostEqual(totalSize, 100))
      return prevLayout;
    return nextLayout;
  }

  // js/live_pane/hooks/pane.ts
  function createPaneHook() {
    let paneHook = {
      mounted() {
        const groupId = this.el.getAttribute("data-pane-group-id");
        if (!groupId) {
          throw Error("data-pane-group-id must exist for pane components!");
        }
        const paneId = this.el.id;
        if (!paneId) {
          throw Error("Id must exist for pane components!");
        }
        const orderAttr = this.el.getAttribute("data-pane-order");
        const order = orderAttr ? Number(orderAttr) : 0;
        const groupData = paneGroupInstances.get(groupId);
        if (!groupData) {
          throw Error('Group with id "' + groupId + '" does not exist.');
        }
        const collapsedSize = Number(this.el.getAttribute("collapsed-size")) || 0;
        const collapsible = this.el.getAttribute("collapsible") === "true";
        const defaultSize = Number(this.el.getAttribute("default-size")) || void 0;
        const maxSize = Number(this.el.getAttribute("max-size")) || 100;
        const minSize = Number(this.el.getAttribute("min-size")) || 0;
        let startingState = "expanded" /* Expanded */;
        if (defaultSize && collapsible && defaultSize <= collapsedSize) {
          startingState = "collapsed" /* Collapsed */;
        }
        const paneData = {
          id: this.el.id,
          order,
          constraints: {
            collapsedSize,
            collapsible,
            defaultSize,
            maxSize,
            minSize
          },
          state: writable(startingState)
        };
        registerPane(
          paneData,
          groupData.paneDataArray,
          groupData.paneDataArrayChanged
        );
        const unsubs = setupReactivePaneStyle(
          this.el,
          groupData,
          paneData,
          defaultSize
        );
        const unsubFromPaneState = paneData.state.subscribe((state) => {
          const onCollapseEncodedJS = this.el.getAttribute("on-collapse");
          if (onCollapseEncodedJS && state === "collapsed" /* Collapsed */) {
            this.liveSocket.execJS(this.el, onCollapseEncodedJS);
            this.el.setAttribute("data-pane-state", "collapsed");
            return;
          }
          const onExpandEncodedJS = this.el.getAttribute("on-expand");
          if (onExpandEncodedJS && state === "expanded" /* Expanded */) {
            this.liveSocket.execJS(this.el, onExpandEncodedJS);
            this.el.setAttribute("data-pane-state", "expanded");
            return;
          }
          this.el.setAttribute("data-pane-state", state);
        });
        unsubs.push(unsubFromPaneState);
        paneInstances.set(paneId, { groupId, unsubs });
        this.handleEvent("collapse", ({ pane_id }) => {
          if (paneId === pane_id) {
            handleTransition(
              this.el,
              groupData.paneDataArray,
              groupData.layout,
              paneData,
              "collapsing" /* Collapsing */
            );
            collapsePane(paneData, groupData);
          }
        });
        this.handleEvent("expand", ({ pane_id }) => {
          if (paneId === pane_id) {
            handleTransition(
              this.el,
              groupData.paneDataArray,
              groupData.layout,
              paneData,
              "expanding" /* Expanding */
            );
            expandPane(paneData, groupData);
          }
        });
      },
      destroyed() {
        const { groupId, unsubs } = paneInstances.get(this.el.id);
        for (const unsub of unsubs) {
          unsub();
        }
        const groupData = paneGroupInstances.get(groupId);
        if (groupData) {
          unregisterPane(
            this.el.id,
            groupData.paneDataArray,
            groupData.paneDataArrayChanged
          );
        }
        paneInstances.delete(this.el.id);
      }
    };
    return paneHook;
  }
  function registerPane(paneData, paneDataArray, paneDataArrayChanged) {
    paneDataArray.update((curr) => {
      const newArr = [...curr, paneData];
      newArr.sort((paneA, paneB) => {
        const orderA = paneA.order;
        const orderB = paneB.order;
        if (orderA == null && orderB == null) {
          return 0;
        } else if (orderA == null) {
          return -1;
        } else if (orderB == null) {
          return 1;
        } else {
          return orderA - orderB;
        }
      });
      return newArr;
    });
    paneDataArrayChanged.set(true);
  }
  function unregisterPane(paneId, paneDataArray, paneDataArrayChanged) {
    const $paneDataArray = paneDataArray.get();
    const index = findPaneDataIndex($paneDataArray, paneId);
    if (index < 0)
      return;
    paneDataArray.update((curr) => {
      curr.splice(index, 1);
      paneDataArrayChanged.set(true);
      return curr;
    });
  }
  function setupReactivePaneStyle(el, groupData, paneData, defaultSize) {
    const getPaneStyle = () => {
      const paneIndex = findPaneDataIndex(
        groupData.paneDataArray.get(),
        paneData.id
      );
      return computePaneFlexBoxStyle({
        defaultSize,
        dragState: dragState.get(),
        layout: groupData.layout.get(),
        paneData: groupData.paneDataArray.get(),
        paneIndex
      });
    };
    const arrUnsub = groupData.paneDataArray.subscribe(
      (_) => el.style.cssText = getPaneStyle()
    );
    const layoutUnsub = groupData.layout.subscribe((_) => {
      el.style.cssText = getPaneStyle();
    });
    const dragStateUnsub = dragState.subscribe(
      (_) => el.style.cssText = getPaneStyle()
    );
    return [arrUnsub, layoutUnsub, dragStateUnsub];
  }
  function collapsePane(paneData, groupData) {
    const prevLayout = groupData.layout.get();
    const paneDataArray = groupData.paneDataArray.get();
    if (!paneData.constraints.collapsible)
      return;
    const paneConstraintsArray = paneDataArray.map(
      (paneData2) => paneData2.constraints
    );
    const {
      collapsedSize = 0,
      paneSize,
      pivotIndices
    } = paneDataHelper(paneDataArray, paneData, prevLayout);
    assert(paneSize != null);
    if (paneSize === collapsedSize)
      return;
    groupData.paneSizeBeforeCollapseMap.update((curr) => {
      curr.set(paneData.id, paneSize);
      return curr;
    });
    const isLastPane = findPaneDataIndex(paneDataArray, paneData.id) === paneDataArray.length - 1;
    const delta = isLastPane ? paneSize - collapsedSize : collapsedSize - paneSize;
    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: prevLayout,
      paneConstraintsArray,
      pivotIndices,
      trigger: "imperative-api"
    });
    if (areArraysEqual(prevLayout, nextLayout)) {
      return;
    }
    groupData.layout.set(nextLayout);
  }
  function expandPane(paneData, groupData) {
    const prevLayout = groupData.layout.get();
    const paneDataArray = groupData.paneDataArray.get();
    if (!paneData.constraints.collapsible)
      return;
    const paneConstraintsArray = paneDataArray.map(
      (paneData2) => paneData2.constraints
    );
    const {
      collapsedSize = 0,
      paneSize,
      minSize = 0,
      pivotIndices
    } = paneDataHelper(paneDataArray, paneData, prevLayout);
    if (paneSize !== collapsedSize)
      return;
    const prevPaneSize = groupData.paneSizeBeforeCollapseMap.get().get(paneData.id);
    const baseSize = prevPaneSize != null && prevPaneSize >= minSize ? prevPaneSize : minSize;
    const isLastPane = findPaneDataIndex(paneDataArray, paneData.id) === paneDataArray.length - 1;
    const delta = isLastPane ? paneSize - baseSize : baseSize - paneSize;
    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: prevLayout,
      paneConstraintsArray,
      pivotIndices,
      trigger: "imperative-api"
    });
    if (areArraysEqual(prevLayout, nextLayout))
      return;
    groupData.layout.set(nextLayout);
  }
  function handleTransition(element, paneDataArray, layout, pane, transState) {
    pane.state.set(transState);
    tick().then(() => {
      const computedStyle = getComputedStyle(element);
      const hasTransition = computedStyle.transitionDuration !== "0s";
      if (!hasTransition) {
        const newState = isPaneCollapsed(paneDataArray.get(), layout.get(), pane) ? "collapsed" /* Collapsed */ : "expanded" /* Expanded */;
        pane.state.set(newState);
        return;
      }
      const handleTransitionEnd = (event) => {
        if (event.propertyName === "flex-grow") {
          pane.state.set(
            isPaneCollapsed(paneDataArray.get(), layout.get(), pane) ? "collapsed" /* Collapsed */ : "expanded" /* Expanded */
          );
          element.removeEventListener("transitionend", handleTransitionEnd);
        }
      };
      element.addEventListener("transitionend", handleTransitionEnd);
    });
  }

  // js/live_pane/chain.ts
  function chain(...callbacks) {
    return (...args) => {
      for (const callback of callbacks) {
        if (typeof callback === "function") {
          callback(...args);
        }
      }
    };
  }

  // js/live_pane/event.ts
  function addEventListener(target, event, handler, options) {
    const events = Array.isArray(event) ? event : [event];
    events.forEach((_event) => target.addEventListener(_event, handler, options));
    return () => {
      events.forEach(
        (_event) => target.removeEventListener(_event, handler, options)
      );
    };
  }

  // js/live_pane/hooks/resizer.ts
  function createResizerHook() {
    let resizerHook = {
      mounted() {
        let groupId = this.el.getAttribute("data-pane-group-id");
        if (!groupId) {
          throw Error("data-pane-group-id must exist for resizer components!");
        }
        let resizerId = this.el.getAttribute("id");
        if (!resizerId) {
          throw Error("Resizer id must exist for resizer components!");
        }
        const groupData = paneGroupInstances.get(groupId);
        if (!groupData) {
          throw Error(`Missing group "${groupId} for resizer "${resizerId}`);
        }
        const thisResizerData = {
          disabled: writable(false),
          isDragging: writable(false),
          resizeHandlerCallback: null,
          unsubs: [],
          isFocused: writable(false)
        };
        resizerInstances.set(resizerId, thisResizerData);
        thisResizerData.disabled.set(
          this.el.getAttribute("data-pane-disabled") === "true"
        );
        if (!thisResizerData.disabled.get()) {
          const keyboardResizeBy = groupData.keyboardResizeBy;
          thisResizerData.resizeHandlerCallback = (event) => {
            var _a, _b, _c, _d;
            const cursorPos = (_b = (_a = dragState.get()) == null ? void 0 : _a.initialCursorPosition) != null ? _b : null;
            const initialLayout = (_d = (_c = dragState.get()) == null ? void 0 : _c.initialLayout) != null ? _d : null;
            resizeHandler(
              groupId,
              resizerId,
              groupData,
              initialLayout,
              cursorPos,
              keyboardResizeBy,
              event
            );
          };
        }
        const unsubEvents = setupResizeEvents(
          resizerId,
          this.el,
          thisResizerData
        );
        thisResizerData.unsubs.push(unsubEvents);
        const style = styleToString({
          cursor: getCursorStyle(groupData.direction.get()),
          "touch-action": "none",
          "user-select": "none",
          "-webkit-user-select": "none",
          "-webkit-touch-callout": "none"
        });
        this.el.style.cssText = style;
        this.el.onblur = () => thisResizerData.isFocused.set(false);
        this.el.onfocus = () => thisResizerData.isFocused.set(true);
        this.el.onmousedown = (e) => {
          var _a;
          e.preventDefault();
          const nextDragState = startDragging(
            groupData.direction,
            groupData.layout,
            resizerId,
            e
          );
          dragState.set(nextDragState);
          thisResizerData.isDragging.set(
            ((_a = dragState.get()) == null ? void 0 : _a.dragHandleId) === resizerId
          );
        };
        this.el.onmouseup = () => {
          dragState.set(null);
          resetGlobalCursorStyle();
          thisResizerData.isDragging.set(false);
        };
        this.el.ontouchcancel = () => {
          dragState.set(null);
          resetGlobalCursorStyle();
          thisResizerData.isDragging.set(false);
        };
        this.el.ontouchend = () => {
          dragState.set(null);
          resetGlobalCursorStyle();
          thisResizerData.isDragging.set(false);
        };
        this.el.ontouchstart = (e) => {
          var _a;
          e.preventDefault();
          const nextDragState = startDragging(
            groupData.direction,
            groupData.layout,
            resizerId,
            e
          );
          dragState.set(nextDragState);
          thisResizerData.isDragging.set(
            ((_a = dragState.get()) == null ? void 0 : _a.dragHandleId) === resizerId
          );
        };
        this.el.onkeydown = (e) => {
          handleKeydown(
            groupId,
            resizerId,
            thisResizerData.disabled.get(),
            thisResizerData.resizeHandlerCallback,
            e
          );
        };
      },
      destroyed() {
        var _a, _b;
        let resizerId = this.el.getAttribute("id");
        for (const unsub of (_b = (_a = resizerInstances.get(resizerId)) == null ? void 0 : _a.unsubs) != null ? _b : []) {
          unsub();
        }
        resizerInstances.delete(resizerId);
      }
    };
    return resizerHook;
  }
  function setupResizeEvents(resizerId, node, params) {
    const { disabled, resizeHandlerCallback, isDragging } = params;
    const onMove = (event) => {
      var _a;
      if (resizerId !== ((_a = dragState.get()) == null ? void 0 : _a.dragHandleId) || disabled.get() || !isDragging.get() || resizeHandlerCallback === null) {
        return;
      }
      resizeHandlerCallback(event);
    };
    const onMouseLeave = (event) => {
      var _a;
      if (resizerId !== ((_a = dragState.get()) == null ? void 0 : _a.dragHandleId) || disabled.get() || !isDragging.get() || resizeHandlerCallback === null) {
        return;
      }
      resizeHandlerCallback(event);
    };
    const stopDraggingAndBlur = () => {
      var _a;
      if (resizerId !== ((_a = dragState.get()) == null ? void 0 : _a.dragHandleId)) {
        return;
      }
      node.blur();
      isDragging.set(false);
      dragState.set(null);
      resetGlobalCursorStyle();
    };
    return chain(
      addEventListener(document.body, "contextmenu", stopDraggingAndBlur),
      addEventListener(document.body, "mousemove", onMove),
      addEventListener(document.body, "mouseleave", onMouseLeave),
      addEventListener(window, "mouseup", stopDraggingAndBlur),
      addEventListener(document.body, "touchmove", onMove, { passive: false }),
      addEventListener(window, "touchend", stopDraggingAndBlur)
    );
  }
  function resizeHandler(groupId, resizerId, groupData, initialLayout, initialCursorPosition, keyboardResizeBy, event) {
    event.preventDefault();
    const direction = groupData.direction.get();
    const $prevLayout = groupData.layout.get();
    const $paneDataArray = groupData.paneDataArray.get();
    const pivotIndices = getPivotIndices(groupId, resizerId);
    let delta = getDeltaPercentage(
      event,
      resizerId,
      direction,
      initialCursorPosition,
      keyboardResizeBy
    );
    if (delta === 0)
      return;
    const isHorizontal = direction === "horizontal";
    if (document.dir === "rtl" && isHorizontal) {
      delta = -delta;
    }
    const paneConstraintsArray = $paneDataArray.map(
      (paneData) => paneData.constraints
    );
    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: initialLayout != null ? initialLayout : $prevLayout,
      paneConstraintsArray,
      pivotIndices,
      trigger: isKeyDown(event) ? "keyboard" : "mouse-or-touch"
    });
    const layoutChanged = !areArraysEqual($prevLayout, nextLayout);
    if (isMouseEvent(event) || isTouchEvent(event)) {
      const $prevDelta = groupData.prevDelta.get();
      if ($prevDelta != delta) {
        groupData.prevDelta.set(delta);
        if (!layoutChanged) {
          if (isHorizontal) {
            setGlobalCursorStyle(delta < 0 ? "horizontal-min" : "horizontal-max");
          } else {
            setGlobalCursorStyle(delta < 0 ? "vertical-min" : "vertical-max");
          }
        } else {
          setGlobalCursorStyle(isHorizontal ? "horizontal" : "vertical");
        }
      }
    }
    if (layoutChanged) {
      groupData.layout.set(nextLayout);
    }
  }
  function startDragging(direction, layout, dragHandleId, event) {
    const handleElement = getResizeHandleElement(dragHandleId);
    assert(handleElement);
    return {
      dragHandleId,
      dragHandleRect: handleElement.getBoundingClientRect(),
      initialCursorPosition: getResizeEventCursorPosition(direction.get(), event),
      initialLayout: layout.get()
    };
  }
  function getPivotIndices(groupId, dragHandleId) {
    const index = getResizeHandleElementIndex(groupId, dragHandleId);
    return index != null ? [index, index + 1] : [-1, -1];
  }
  function getDeltaPercentage(e, dragHandleId, dir, initialCursorPosition, keyboardResizeBy) {
    if (isKeyDown(e)) {
      const isHorizontal = dir === "horizontal";
      let delta = 0;
      if (e.shiftKey) {
        delta = 100;
      } else if (keyboardResizeBy != null) {
      } else {
        delta = 5;
      }
      let movement = 0;
      switch (e.key) {
        case "ArrowDown":
          movement = isHorizontal ? 0 : delta;
          break;
        case "ArrowLeft":
          movement = isHorizontal ? -delta : 0;
          break;
        case "ArrowRight":
          movement = isHorizontal ? delta : 0;
          break;
        case "ArrowUp":
          movement = isHorizontal ? 0 : -delta;
          break;
        case "End":
          movement = 100;
          break;
        case "Home":
          movement = -100;
          break;
      }
      return movement;
    } else {
      if (initialCursorPosition == null)
        return 0;
      const isHorizontal = dir === "horizontal";
      const handleElement = getResizeHandleElement(dragHandleId);
      assert(handleElement);
      const groupId = handleElement.getAttribute("data-pane-group-id");
      assert(groupId);
      const cursorPosition = getResizeEventCursorPosition(dir, e);
      const groupElement = getPaneGroupElement(groupId);
      assert(groupElement);
      const groupRect = groupElement.getBoundingClientRect();
      const groupSizeInPixels = isHorizontal ? groupRect.width : groupRect.height;
      const offsetPixels = cursorPosition - initialCursorPosition;
      const offsetPercentage = offsetPixels / groupSizeInPixels * 100;
      return offsetPercentage;
    }
  }
  function getResizeEventCursorPosition(dir, e) {
    var _a;
    const isHorizontal = dir === "horizontal";
    if (isMouseEvent(e)) {
      return isHorizontal ? e.clientX : e.clientY;
    } else if (isTouchEvent(e)) {
      const firstTouch = e.touches[0];
      assert(firstTouch);
      return isHorizontal ? firstTouch.screenX : firstTouch.screenY;
    } else {
      throw Error(
        `Unsupported event type "${(_a = e.type) != null ? _a : "unknown"}"`
      );
    }
  }
  function getResizeHandleElementsForGroup2(groupId) {
    return Array.from(
      document.querySelectorAll(
        `[data-pane-resizer-id][data-pane-group-id="${groupId}"]`
      )
    );
  }
  function getResizeHandleElementIndex(groupId, id) {
    const handles = getResizeHandleElementsForGroup2(groupId);
    const index = handles.findIndex(
      (handle) => handle.getAttribute("data-pane-resizer-id") === id
    );
    return index != null ? index : null;
  }
  function getResizeHandleElement(id) {
    const element = document.querySelector(
      `[data-pane-resizer][data-pane-resizer-id="${id}"]`
    );
    if (element) {
      return element;
    }
    return null;
  }
  function getPaneGroupElement(id) {
    const element = document.querySelector(
      `[data-pane-group][data-pane-group-id="${id}"]`
    );
    if (element) {
      return element;
    }
    return null;
  }
  function handleKeydown(groupId, resizeHandleId, disabled, resizeHandler2, event) {
    if (disabled || !resizeHandler2 || event.defaultPrevented)
      return;
    const resizeKeys = [
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "End",
      "Home"
    ];
    if (resizeKeys.includes(event.key)) {
      event.preventDefault();
      resizeHandler2(event);
      return;
    }
    if (event.key !== "F6")
      return;
    event.preventDefault();
    const handles = getResizeHandleElementsForGroup2(groupId);
    const index = getResizeHandleElementIndex(groupId, resizeHandleId);
    if (index === null)
      return;
    const nextIndex = event.shiftKey ? index > 0 ? index - 1 : handles.length - 1 : index + 1 < handles.length ? index + 1 : 0;
    const nextHandle = handles[nextIndex];
    nextHandle.focus();
  }

  // js/live_pane/live_pane.ts
  function createLivePaneHooks() {
    let groupHook = createGroupHook();
    let paneHook = createPaneHook();
    let resizerHook = createResizerHook();
    return { groupHook, paneHook, resizerHook };
  }
  return __toCommonJS(live_pane_exports);
})();
