defmodule LivePane do
  @moduledoc """
  Function components for PaneGroup, Pane, and PaneResizer.
  Allows users to write:

      <LivePane.group id="demo">
        <LivePane.pane id="pane1" group_id="demo">
          <div>Pane 1</div>
        </LivePane.pane>
        <LivePane.resizer id="resizer1" group_id="demo">
          <div>Resizer 1</div>
        </LivePane.resizer>
        <LivePane.pane id="pane2" group_id="demo">
          <div>Pane 2</div>
        </LivePane.pane>
      </LivePane.group>
  """
  use Phoenix.Component

  attr :id, :string, required: true
  attr :class, :string, default: ""
  attr :direction, :string, values: ["horizontal", "vertical"], default: "horizontal"
  attr :rest, :global
  slot :inner_block, required: true

  def group(assigns) do
    ~H"""
    <.live_component module={LivePane.Group} id={@id} direction={@direction} class={@class} {@rest}>
      {render_slot(@inner_block)}
    </.live_component>
    """
  end

  attr :id, :string, required: true, doc: "The id of the pane element."
  attr :group_id, :string, required: true, doc: "ID of the group this pane belongs to"
  attr :class, :string, default: "", doc: "Extra classes to apply to the pane"

  attr :collapsed_size, :integer,
    default: 0,
    doc: "The size of the pane when it is in a collapsed state."

  attr :collapsible, :boolean,
    default: false,
    doc: "Whether the pane can be collapsed."

  attr :default_size, :integer,
    default: nil,
    doc: "The default size of the pane in percentage of the group's size."

  attr :max_size, :integer,
    default: 100,
    doc: "The maximum size of the pane in percentage of the group's size."

  attr :min_size, :integer,
    default: 0,
    doc: "The minimum size of the pane in percentage of the group's size."

  attr :order, :integer,
    default: 0,
    doc:
      "The order of the pane in the group. Useful for maintaining order when conditionally rendering panes."

  attr :rest, :global
  slot :inner_block, required: true

  def pane(assigns) do
    ~H"""
    <.live_component
      module={LivePane.Pane}
      group_id={@group_id}
      id={@id}
      class={@class}
      collapsed_size={@collapsed_size}
      collapsible={@collapsible}
      default_size={@default_size}
      max_size={@max_size}
      min_size={@min_size}
      order={@order}
      {@rest}
    >
      {render_slot(@inner_block)}
    </.live_component>
    """
  end

  attr :id, :string, required: true
  attr :group_id, :string, required: true
  attr :direction, :string, default: "horizontal"
  attr :active, :string, default: "pointer"
  attr :disabled, :boolean, default: false
  attr :class, :string, default: ""
  attr :rest, :global
  slot :inner_block

  def resizer(assigns) do
    ~H"""
    <.live_component
      module={LivePane.Resizer}
      group_id={@group_id}
      id={@id}
      direction={@direction}
      active={@active}
      disabled={@disabled}
      class={@class}
      {@rest}
    >
      {render_slot(@inner_block)}
    </.live_component>
    """
  end
end
