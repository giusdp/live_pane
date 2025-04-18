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
    <div id={@id} phx-update="ignore" phx-hook="PaneGroup">
      {render_slot(@inner_block)}
    </div>
    """
  end
end
