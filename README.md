# Live Pane
[![Elixir CI](https://github.com/giusdp/live_pane/actions/workflows/tests.yaml/badge.svg?branch=main)](https://github.com/giusdp/live_pane/actions/workflows/tests.yaml)
[![Hex](https://img.shields.io/hexpm/v/live_pane)](https://hex.pm/packages/live_pane)

A client-side, dependency-free, set hooks and components to easily create resizable panels in your Phoenix applications.

This project has taken a lot of inspiration and code from the work done by 
[paneforge](https://.github.com/svecosystem/paneforge) and [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels).

## Installation

Add `live_pane` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:live_pane, "~> 0.5.0"}
  ]
end
```

Then open up your `app.js` and import/setup the hooks.

If you have a `package.json` file at the top of `assets`, you can add this to it:

```json
"dependencies": {
  "live_pane": "file:../deps/live_pane",
},
```

And then import the module:

```javascript
import { createLivePaneHooks } from 'live_pane';
```

Or you can import the file directly:

```javascript
// this path would be relative to where your app.js happens to be.
import { createLivePaneHooks } from '../deps/live_pane'
```

Finally setup the hooks in your `app.js` file:

```javascript
const { groupHook, paneHook, resizerHook } = createLivePaneHooks()

let Hooks = {}
Hooks.live_pane_group = groupHook;
Hooks.live_pane = paneHook;
Hooks.live_pane_resizer = resizerHook;

let liveSocket = new LiveSocket("/live", Socket, {
  hooks: Hooks,
  ...
})
```

Also add `'../deps/live_pane/lib/**/*.*ex'` to your list of paths Tailwind will look for class names, in your
`tailwind.config.js`:

```javascript
// assets/tailwind.config.js

module.exports = {
  content: [
    './js/**/*.js',
    '../lib/your_app_web.ex',
    '../lib/your_app_web/**/*.*ex',
    '../deps/live_pane/lib/**/*.*ex', <-- add this line with the correct path
  ]
}
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
- [x] Collapsible panes 
- [x] Keyboard support
- [x] Touch support
- [x] Server-side events (collapse/expand)
- [x] Documentation
- [ ] Persistent layouts
- [ ] Accessibility (aria data)