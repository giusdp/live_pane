defmodule DemoWeb.CollapsibleLive do
  use DemoWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, collapsed: false)}
  end

  def handle_event("toggle", _, socket) do
    collapsed = socket.assigns.collapsed
    ev = if collapsed, do: "expand", else: "collapse"

    socket =
      socket
      |> update(:collapsed, &(!&1))
      |> push_event(ev, %{
        pane_id: "demo4_pane_1"
      })

    {:noreply, socket}
  end
end
