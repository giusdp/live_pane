defmodule DemoWeb.StatesLive do
  use DemoWeb, :live_view

  alias Phoenix.LiveView.JS

  def mount(_params, _session, socket) do
    {:ok, assign(socket, collapsed: false, collapsed3: false)}
  end

  def handle_event("toggle", _, socket) do
    collapsed = socket.assigns.collapsed
    ev = if collapsed, do: "expand", else: "collapse"

    socket =
      socket
      |> update(:collapsed, &(!&1))
      |> push_event(ev, %{pane_id: "demo_pane_1"})

    {:noreply, socket}
  end

  def handle_event("collapsed", %{"pane" => pane}, socket) do
    socket =
      case pane do
        "demo_pane_1" -> assign(socket, :collapsed, true)
        "demo_pane_3" -> assign(socket, :collapsed3, true)
      end

    {:noreply, socket}
  end

  def handle_event("expanded", %{"pane" => pane}, socket) do
    socket =
      case pane do
        "demo_pane_1" -> assign(socket, :collapsed, false)
        "demo_pane_3" -> assign(socket, :collapsed3, false)
      end

    {:noreply, socket}
  end

  def handle_event("toggle3", _, socket) do
    collapsed3 = socket.assigns.collapsed3
    ev = if collapsed3, do: "expand", else: "collapse"

    socket =
      socket
      |> update(:collapsed3, &(!&1))
      |> push_event(ev, %{
        pane_id: "demo_pane_3"
      })

    {:noreply, socket}
  end
end
