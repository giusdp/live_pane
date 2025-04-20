defmodule LivePane.Resizer do
  @moduledoc """
  TODO
  """
  use Phoenix.LiveComponent

  @impl true
  def update(assigns, socket) do
    direction = assigns[:direction] || "horizontal"
    active = assigns[:active] || "pointer"
    enabled = assigns[:disabled] || true
    tab_index = assigns[:tab_index] || 0

    socket =
      socket
      |> assign(assigns)
      |> assign(:direction, direction)
      |> assign(:active, active)
      |> assign(:enabled, enabled)
      |> assign(:tab_index, tab_index)

    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      role="separator"
      phx-update="ignore"
      phx-hook="live_pane_resizer"
      data-pane-resizer=""
      data-pane-resizer-id={@id}
      data-pane-group-id={@group_id}
      data-direction={@direction}
      data-active={@active}
      data-enabled={@enabled}
      tabindex={@tab_index}
      style=""
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
