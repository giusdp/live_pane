defmodule DemoWeb.ResizeLive do
  use DemoWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, assign(socket, size: 50)}
  end

  def handle_event("update_size", %{"size" => size}, socket) do
    case Integer.parse(size) do
      {value, _} -> {:noreply, assign(socket, :size, value)}
      :error -> {:noreply, socket}
    end
  end

  def handle_event("apply_size", _, socket) do
    socket = push_event(socket, "resize", %{pane_id: "resize_pane_1", size: socket.assigns.size})
    {:noreply, socket}
  end
end
