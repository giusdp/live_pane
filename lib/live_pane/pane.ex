defmodule LivePane.Pane do
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
      phx-hook="live_pane"
      data-pane-group-id={@group_id}
      class={@class}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
