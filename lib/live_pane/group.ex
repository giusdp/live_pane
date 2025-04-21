defmodule LivePane.Group do
  @moduledoc """
  A LiveComponent that wraps child panes and manages resize events via a "PaneGroup" JS hook.
  """
  use Phoenix.LiveComponent

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  # TODO: set direction here and keep in sync with hook (direction determines flex direction)
  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      data-pane-group
      data-pane-group-id={@id}
      phx-update="ignore"
      phx-hook="live_pane_group"
      class={["flex flex-row h-full w-full overflow-hidden"]}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
