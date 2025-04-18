defmodule LivePane do
  @moduledoc """
  Function components for PaneGroup, Pane, and PaneResizer.
  Allows users to write:

      <LivePane.group id="demo">…</LivePane.group>
  """
  use Phoenix.Component

  attr :id, :string, required: true
  attr :rest, :global
  slot :inner_block, required: true

  def group(assigns) do
    ~H"""
    <.live_component module={LivePane.Group} id={@id} {@rest}>
      {render_slot(@inner_block)}
    </.live_component>
    """
  end

  attr :id, :string, required: true
  attr :group_id, :string, required: true
  attr :rest, :global
  slot :inner_block, required: true

  def pane(assigns) do
    ~H"""
    <.live_component module={LivePane.Pane} group_id={@group_id} id={@id} {@rest}>
      {render_slot(@inner_block)}
    </.live_component>
    """
  end
end
