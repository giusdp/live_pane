# Changelog

All notable changes to this project will be documented in this file.
## [0.6.2] (2025-05-05)

- Pane recalculates styling when updating content within it [#12](https://github.com/giusdp/live_pane/issues/12).

## [0.6.1] (2025-05-05)

- Replace inline style change when resizing by direct cursor style field change [#9](https://github.com/giusdp/live_pane/issues/9).

## [0.6.0] (2025-05-04)

- Add `data-pane-state` HTML attribute to track collapsed, collapsing, expanded, expanding states.
- Add `on_collapse` and `on_expand` attr in LivePane.pane component to pass JS commands.
- Add new example to showcase styling based on the pane state with transition animation.

## [0.5.0] (2025-05-01)

- Add a new attr on groups `auto_save` to enable auto-saving on layout changes the sizes of the panes in local storage in order to restore them on page reload.
- Add dynamic aria attributes to the resizers to improve accessibility.
- Update doc site with new persistent layout example.

## [0.4.0] (2025-04-30)

- Add `collpase` and `expand` server-side events.
- Fix handling of more than 2 panes and resizers in single group.
- Changed the attribute name `default_size` to `starting_size`.
- Removed phx-update="ignore" from the components.
- Added syntax highlighting hook for the docs.

## [v0.3.0] (2025-04-27)

- Keyboard support for resizing panes.
- Turn live pane components into simple function components so they can be used in dead views as well.
- Docs site redone.

## [v0.2.0] (2025-04-24)

- Touch support for resizing panes.
- Add constraints attrs to panes (it also enables collapsing).

## [v0.1.0] (2025-04-23)

🚀 Initial release.

- Basic functionality to resize a 2-pane layout.
- Horizontal and vertical pane orientation.
- Basic multiple (and nested) pane groups.