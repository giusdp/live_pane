# Live Pane
[![Elixir CI](https://github.com/giusdp/live_pane/actions/workflows/tests.yaml/badge.svg?branch=main)](https://github.com/giusdp/live_pane/actions/workflows/tests.yaml)
[![Hex](https://img.shields.io/hexpm/v/live_pane)](https://hex.pm/packages/live_pane)

A dependency-free client-side set of components to easily create resizable panels in your Phoenix LiveView applications.

This project has taken a lot of inspiration and code from the work done by 
[paneforge](https://.github.com/svecosystem/paneforge) and [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels).

## Installation

Add `live_pane` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:live_pane, "~> 0.1.0"}
  ]
end
```

Then open up your `app.js` and import/setup the hooks:

```javascript
const { groupHook, paneHook, resizerHook } = createLivePaneHooks()

let Hooks = {}
Hooks.live_pane_group = groupHook;
Hooks.live_pane = paneHook;
Hooks.live_pane_resizer = resizerHook;

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket("/live", Socket, {
  hooks: Hooks,
  ...
})
```

## Usage

Now you can use the Group, Pane and Resizer components in your LiveView templates.

```html
<LivePane.group id="demo" class="h-[450px]">
  <LivePane.pane group_id="demo" id="demo_pane_1" class="h-full flex items-center justify-center">
    One
  </LivePane.pane>

  <LivePane.resizer
    id="demo-resizer"
    group_id="demo"
    class="flex h-full w-2 items-center justify-center"
  >
    <div class="size-4 rounded-sm border bg-brand"></div>
  </LivePane.resizer>
  <LivePane.pane group_id="demo" id="demo_pane_2" class="h-full flex items-center justify-center">
    Two
  </LivePane.pane>
</LivePane.group>
```

Just make sure to set an `id` for the group and then use the same id in each pane and resizer for the `group_id` attribute, so they can be linked together.
## ROADMAP

(not in order)

- [x] Basic 2 pane dragging
- [x] Support nested groups
- [x] Vertical orientation
- [ ] Collapsible panes 
- [ ] Custom Styling
- [ ] Event callbacks
- [ ] Keyboard support
- [ ] Touch support
- [ ] Save state
- [ ] Documentation
- [ ] Gen IDs in pane and resizer