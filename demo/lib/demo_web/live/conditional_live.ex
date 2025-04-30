defmodule DemoWeb.ConditionalLive do
  alias Phoenix.LiveView.JS
  use DemoWeb, :live_view

  def mount(_params, _session, socket) do
    socket =
      socket
      |> assign(:hide_one, false)
      |> assign(:hide_three, false)

    {:ok, socket}
  end

  def handle_event("hide_one", _, socket) do
    socket =
      socket
      |> update(:hide_one, fn hide_one -> !hide_one end)

    socket.assigns.hide_one |> dbg

    {:noreply, socket}
  end

  def handle_event("hide_three", _, socket) do
    socket =
      socket
      |> update(:hide_three, fn hide_three -> !hide_three end)

    {:noreply, socket}
  end
end
