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

  attr :id, :string, required: true, doc: "The id of the group element."

  attr :direction, :string,
    values: ["horizontal", "vertical"],
    default: "horizontal",
    doc: "The direction of the panes."

  attr :keyboard_resize_by, :integer,
    doc:
      "The amount of space to add to the pane group when the keyboard resize event is triggered."

  attr :class, :string, default: "", doc: "Extra classes to apply to the group."
  attr :rest, :global

  slot :inner_block, required: true

  @doc """
  The group component wraps a collection of panes or nested groups and manages resize events via the "PaneGroup" JS hook.
  """
  def group(assigns) do
    class =
      assigns.class <>
        if assigns.direction == "vertical", do: " flex-col", else: " flex-row"

    assigns =
      assigns
      |> assign(:class, class)
      |> assign_new(:keyboard_resize_by, fn -> nil end)

    ~H"""
    <div
      id={@id}
      data-pane-group=""
      data-pane-group-id={@id}
      data-pane-direction={@direction}
      phx-update="ignore"
      phx-hook="live_pane_group"
      class={["flex overflow-hidden items-center justify-center", @class]}
      keyboard-resize-by={@keyboard_resize_by}
      {@rest}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end

  attr :id, :string, required: true, doc: "The id of the pane element."
  attr :group_id, :string, required: true, doc: "ID of the group this pane belongs to."
  attr :class, :string, default: "", doc: "Extra classes to apply to the pane."

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

  @doc """
  The Pane component is used to create an individual pane within a PaneGroup.
  """
  def pane(assigns) do
    collapsible = if assigns.collapsible, do: "true", else: "false"
    assigns = assign(assigns, :collapsible, collapsible)

    ~H"""
    <div
      id={@id}
      phx-update="ignore"
      phx-hook="live_pane"
      data-pane-group-id={@group_id}
      collapsed-size={@collapsed_size}
      collapsible={@collapsible}
      default-size={@default_size}
      max-size={@max_size}
      min-size={@min_size}
      data-pane-order={@order}
      class={@class}
      {@rest}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end

  attr :id, :string, required: true, doc: "The id of the resize handle."
  attr :group_id, :string, required: true, doc: "The ID of the pane group the handle belongs to."

  attr :disabled, :boolean, default: false, doc: "Whether the resize handle is disabled."
  attr :class, :string, default: "", doc: "Extra classes to apply to the handle."
  attr :rest, :global

  slot :inner_block

  @doc """
  The Resizer component is used to create a draggable handle between two panes that allows the user to resize them.
  """
  def resizer(assigns) do
    ~H"""
    <div
      id={@id}
      role="separator"
      phx-update="ignore"
      phx-hook="live_pane_resizer"
      data-pane-resizer=""
      data-pane-resizer-id={@id}
      data-pane-group-id={@group_id}
      data-pane-disabled={@disabled}
      class={@class}
      {@rest}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end
end
