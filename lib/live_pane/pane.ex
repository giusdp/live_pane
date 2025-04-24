defmodule LivePane.Pane do
  @moduledoc """
  TODO
  """
  use Phoenix.LiveComponent

  @impl true
  def update(assigns, socket) do
    collapsible = if assigns.collapsible, do: "true", else: "false"
    socket = socket |> assign(assigns) |> assign(:collapsible, collapsible)
    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      phx-update="ignore"
      phx-hook="live_pane"
      data-pane-group-id={@group_id}
      class={@class}
      collapsed-size={@collapsed_size}
      collapsible={@collapsible}
      default-size={@default_size}
      max-size={@max_size}
      min-size={@min_size}
      data-pane-order={@order}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
