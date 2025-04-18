defmodule LivePane.PaneGroup do
  @moduledoc """
  A LiveComponent that wraps child panes and manages resize events via a "PaneGroup" JS hook.

  ## Assigns

    * `:id`              - (required) the DOM id for the pane group
    * `:direction`       - : "horizontal" or "vertical" (default: "horizontal")
    * `:auto_save_key`   - optional key for localStorage persistence
    * `:keyboard_step`   - optional step size for keyboard resizing (default: 10)
    * `:on_layout`       - optional function `(sizes) -> any` called on layout change
    * `:inner_block`     - slot for nested Pane and PaneResizer components
  """
  use Phoenix.LiveComponent

  @impl true
  def update(assigns, socket) do
    socket =
      socket
      |> assign_new(:id, fn -> assigns.id end)
      |> assign_new(:direction, fn -> assigns.direction || "horizontal" end)
      |> assign_new(:auto_save_key, fn -> assigns.auto_save_key end)
      |> assign_new(:keyboard_step, fn -> assigns.keyboard_step || 10 end)
      |> assign_new(:on_layout, fn -> assigns.on_layout end)
      |> assign_new(:initial_layout, fn -> assigns.initial_layout || [] end)

    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      phx-hook="PaneGroup"
      phx-update="ignore"
      data-direction={@direction}
      data-auto-save-key={@auto_save_key}
      data-keyboard-step={@keyboard_step}
      data-initial-layout={Jason.encode!(@initial_layout)}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
