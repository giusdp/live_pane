defmodule LivePane.Group do
  @moduledoc """
  A LiveComponent that wraps child panes and manages resize events via a "PaneGroup" JS hook.
  """
  use Phoenix.LiveComponent

  @impl true
  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div
      id={@id}
      data-pane-group
      data-pane-group-id={@id}
      phx-update="ignore"
      phx-hook="live_pane_group"
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
