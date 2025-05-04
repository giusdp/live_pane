defmodule DemoWeb.Layouts do
  @moduledoc """
  This module holds different layouts used by your application.

  See the `layouts` directory for all templates available.
  The "root" layout is a skeleton rendered as part of the
  application router. The "app" layout is set as the default
  layout on both `use DemoWeb, :controller` and
  `use DemoWeb, :live_view`.
  """
  use DemoWeb, :html

  embed_templates "layouts/*"

  defp navbar(assigns) do
    toggle =
      JS.toggle(to: "#mobile-sidebar")

    assigns = assign(assigns, toggle: toggle)

    ~H"""
    <div class="container fixed top-0 z-50 max-w-full bg-transparent backdrop-blur-sm">
      <div class="pointer-events-none absolute z-[-1] h-full w-full bg-white shadow-[0_2px_4px_rgba(0,0,0,.02),0_1px_0_rgba(0,0,0,.06)]">
      </div>
      <nav class="mx-auto flex h-[50px] max-w-[90rem] items-center justify-end gap-2 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)]">
        <.link class="flex items-center hover:opacity-75 font-semibold" href="/">
          Live Pane
        </.link>
        <div class="grow"></div>
        <a
          href="https://github.com/giusdp/live_pane"
          target="_blank"
          rel="noreferrer"
          class="p-2 text-current"
        >
          <svg width="24" height="24" fill="currentColor" viewBox="3 3 18 18">
            <title>GitHub</title>
            <path d="M12 3C7.0275 3 3 7.12937 3 12.2276C3 16.3109 5.57625 19.7597 9.15374 20.9824C9.60374 21.0631 9.77249 20.7863 9.77249 20.5441C9.77249 20.3249 9.76125 19.5982 9.76125 18.8254C7.5 19.2522 6.915 18.2602 6.735 17.7412C6.63375 17.4759 6.19499 16.6569 5.8125 16.4378C5.4975 16.2647 5.0475 15.838 5.80124 15.8264C6.51 15.8149 7.01625 16.4954 7.18499 16.7723C7.99499 18.1679 9.28875 17.7758 9.80625 17.5335C9.885 16.9337 10.1212 16.53 10.38 16.2993C8.3775 16.0687 6.285 15.2728 6.285 11.7432C6.285 10.7397 6.63375 9.9092 7.20749 9.26326C7.1175 9.03257 6.8025 8.08674 7.2975 6.81794C7.2975 6.81794 8.05125 6.57571 9.77249 7.76377C10.4925 7.55615 11.2575 7.45234 12.0225 7.45234C12.7875 7.45234 13.5525 7.55615 14.2725 7.76377C15.9937 6.56418 16.7475 6.81794 16.7475 6.81794C17.2424 8.08674 16.9275 9.03257 16.8375 9.26326C17.4113 9.9092 17.76 10.7281 17.76 11.7432C17.76 15.2843 15.6563 16.0687 13.6537 16.2993C13.98 16.5877 14.2613 17.1414 14.2613 18.0065C14.2613 19.2407 14.25 20.2326 14.25 20.5441C14.25 20.7863 14.4188 21.0746 14.8688 20.9824C16.6554 20.364 18.2079 19.1866 19.3078 17.6162C20.4077 16.0457 20.9995 14.1611 21 12.2276C21 7.12937 16.9725 3 12 3Z">
            </path>
          </svg>
          <span class="sr-only">GitHub</span><span class="sr-only select-none"> (opens in a new tab)</span>
        </a>
      </nav>
    </div>
    """
  end

  @doc """
  A layout with a responsive sidebar (desktop sticky + mobile off-canvas) using LiveView for interactions.
  """
  def layout_with_sidebar(assigns) do
    ~H"""
    <aside
      id="sidebar"
      class="block md:w-[200px] flex-shrink-0 h-full overflow-y-auto sticky mt-12 xl:ml-20"
    >
      <nav class="relative text-sm leading-6 ">
        <ul>
          <li class="mt-8">
            <div>
              <div class="mb-6 inline-flex w-full items-center justify-between font-medium lg:mb-3 lg:text-sm">
                Overview
              </div>
              <ul class="space-y-6 border-l border-border lg:space-y-2">
                <div class="space-y-6 lg:space-y-2">
                  <li>
                    <.link href={~p"/"} class="-ml-px block border-l pl-4">
                      Introduction
                    </.link>
                  </li>
                </div>
              </ul>
            </div>
          </li>
          <li class="mt-8">
            <div>
              <div class="mb-6 inline-flex w-full items-center justify-between font-medium lg:mb-3 lg:text-sm">
                Components
              </div>
              <ul class="space-y-6 border-l border-border lg:space-y-2">
                <div class="space-y-6 lg:space-y-2">
                  <li>
                    <.link href={~p"/group"} class="-ml-px block border-l pl-4">
                      Group
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/pane"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Pane
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/resizer"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Resizer
                    </.link>
                  </li>
                </div>
              </ul>
            </div>
          </li>
          <li class="mt-8">
            <div>
              <div class="mb-6 inline-flex w-full items-center justify-between font-medium lg:mb-3 lg:text-sm">
                Examples
              </div>
              <ul class="space-y-6 border-l border-border lg:space-y-2">
                <div class="space-y-6 lg:space-y-2">
                  <li>
                    <.link href={~p"/horizontal"} class="-ml-px block border-l pl-4">
                      Horizontal
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/vertical"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Vertical
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/nested"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Nested
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/overflowing"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Overflowing
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/collapsible"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Collapsible
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/conditional"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Conditional
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/persistent"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Persistent
                    </.link>
                  </li>
                  <li>
                    <.link
                      href={~p"/states"}
                      class="-ml-px block border-l pl-4 border-border text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      States
                    </.link>
                  </li>
                </div>
              </ul>
            </div>
          </li>
        </ul>
      </nav>
    </aside>
    """
  end
end
