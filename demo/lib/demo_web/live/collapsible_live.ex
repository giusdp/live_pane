defmodule DemoWeb.CollapsibleLive do
  alias Phoenix.LiveView.JS
  use DemoWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, collapsed: false)}
  end

  def handle_event("toggle", _, socket) do
    collapsed = socket.assigns.collapsed
    ev = if collapsed, do: "expand", else: "collapse"

    socket =
      socket
      |> update(:collapsed, &(!&1))
      |> push_event(ev, %{
        pane_id: "demo4_pane_1"
      })

    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="mx-auto w-full min-w-0 max-w-3xl pt-8">
      <header class="prose relative mb-4 max-w-3xl border-b border-border pb-8  ">
        <p class="mb-4 text-sm/6 font-medium capitalize text-accent-foreground"></p>

        <h1 class="mb-6 scroll-m-20 text-4xl font-bold tracking-tight">Collapsible Panes</h1>

        <p class="mt-2 text-balance text-lg text-muted-foreground">
          An example of how to create collapsible panes.
        </p>
      </header>

      <div class="markdown prose relative max-w-3xl pt-4">
        <p class="leading-7 [&amp;:not(:first-child)]:mt-6">
          You can use the <code>collapsedSize</code>
          and <code>collapsible</code>
          props to create collapsible panes. The <code>collapsedSize</code>
          prop sets the size of the pane when it is in a collapsed state, and the
          <code>collapsible</code>
          prop determines whether the pane can be collapsed.
        </p>
        <button
          class="mb-4 no-underline inline-flex items-center justify-center whitespace-nowrap rounded-md
            text-sm font-medium border transition-colors shadow-sm
            active:text-zinc-800 h-9 px-5 py-1 !bg-zinc-50 !border-zinc-200/50 !text-brand  hover:!bg-zinc-100"
          phx-click="toggle"
        >
          <%= if !@collapsed do %>
            Collapse
          <% else %>
            Expand
          <% end %>
        </button>
        <LivePane.group id="demo4" class="h-[450px] border-2 border-gray-300 rounded-lg">
          <LivePane.pane
            collapsible={true}
            collapsed_size={5}
            min_size={15}
            starting_size={50}
            group_id="demo4"
            id="demo4_pane_1"
            class="h-full"
          >
            <div class="flex h-full items-center justify-center rounded-lg bg-gray-100 p-6">
              <span class="font-semibold">I collapse to 5%!</span>
            </div>
          </LivePane.pane>

          <LivePane.resizer
            id="demo4-resizer"
            group_id="demo4"
            class="relative flex h-full w-2 items-center justify-center"
          >
            <div class="z-10 h-7 flex items-center w-4 rounded-sm border bg-brand">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                viewBox="0 0 256 256"
                class="size-4 text-black"
              >
                <rect width="256" height="256" fill="none"></rect>
                <path d="M108,60A16,16,0,1,1,92,44,16,16,0,0,1,108,60Zm56,16a16,16,0,1,0-16-16A16,16,0,0,0,164,76ZM92,112a16,16,0,1,0,16,16A16,16,0,0,0,92,112Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,112ZM92,180a16,16,0,1,0,16,16A16,16,0,0,0,92,180Zm72,0a16,16,0,1,0,16,16A16,16,0,0,0,164,180Z">
                </path>
              </svg>
            </div>
          </LivePane.resizer>
          <LivePane.pane starting_size={50} group_id="demo4" id="demo4_pane_2" class="h-full">
            <div class="flex h-full items-center justify-center rounded-lg bg-gray-100 p-6">
              <span class="font-semibold">I don't.</span>
            </div>
          </LivePane.pane>
        </LivePane.group>

        <p class="mt-12 mb-2">
          The collapsible pane is set with a min_size of 15% and a collapsed size of 5%.
        </p>
        <h2 class="mt-12 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">Anatomy</h2>

        <p class="not-prose p-  2" tabindex="0" id="code"></p>
        <script type="module">
              import { codeToHtml } from 'https://esm.sh/shiki@3.0.0'

              document.getElementById('code').innerHTML = await codeToHtml(`
          <LivePane.group id="demo" direction="horizontal">
            <LivePane.pane
              group_id="demo"
              id="demo_pane_1"
              starting_size={50}
              collapsed_size={5}
              collapsible={true}
              min_size={15}>
                <!-- ... content here -->
            </LivePane.pane>

            <LivePane.resizer id="demo-resizer" group_id="demo">
              <!-- your handle here -->
            </LivePane.resizer>

            <LivePane.pane group_id="demo" id="demo_pane_2" default_sise={50}>
                <!-- ... content here -->
            </LivePane.pane>
          </LivePane.group>
                      `, {
                        lang: 'elixir',
                        theme: 'rose-pine'
                      })
        </script>
      </div>
    </div>
    """
  end
end
