defmodule LivePane.Group do
  @moduledoc """
  A LiveComponent that wraps child panes and manages resize events via a "PaneGroup" JS hook.
  """
  use Phoenix.LiveComponent

  @impl true
  def update(assigns, socket) do
    class =
      assigns.class <>
        if assigns.direction == "vertical", do: " flex-col", else: " flex-row"

    socket =
      assign(socket, assigns)
      |> assign(:class, class)

    {:ok, socket}
  end

  # TODO: set direction here and keep in sync with hook (direction determines flex direction)
  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      data-pane-group=""
      data-pane-group-id={@id}
      data-pane-direction={@direction}
      phx-update="ignore"
      phx-hook="live_pane_group"
      class={["flex overflow-hidden items-center justify-center", @class]}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
