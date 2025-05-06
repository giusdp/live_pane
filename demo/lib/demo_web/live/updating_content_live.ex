defmodule DemoWeb.UpdatingContentLive do
  use DemoWeb, :live_view

  def mount(_params, _session, socket) do
    socket = create_cards(socket)
    {:ok, socket}
  end

  defp card(assigns) do
    ~H"""
    <div phx-click="toggle_card" phx-value-id={@id} class="w-full">
      <h2>{@title}</h2>
      <p :if={@expanded}>{@content}</p>
    </div>
    """
  end

  defp create_cards(socket) do
    cards =
      for i <- 1..10, do: %{id: "card_#{i}", title: "Card #{i}", content: "Content for card #{i}"}

    expanded_cards = MapSet.new()

    socket
    |> assign(:cards, cards)
    |> assign(:expanded_cards, expanded_cards)
  end

  def handle_event("toggle_card", %{"id" => id}, socket) do
    expanded_cards = socket.assigns.expanded_cards

    expanded_cards =
      if MapSet.member?(expanded_cards, id),
        do: MapSet.delete(expanded_cards, id),
        else: MapSet.put(expanded_cards, id)

    {:noreply, assign(socket, :expanded_cards, expanded_cards)}
  end
end
