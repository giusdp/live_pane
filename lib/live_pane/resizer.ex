defmodule LivePane.Resizer do
  @moduledoc """
  TODO
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
      phx-update="ignore"
      phx-hook="live_pane_resizer"
      data-pane-resizer-id={@id}
      data-pane-group-id={@group_id}
      role="separator"
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
