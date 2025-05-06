defmodule DemoWeb.UpdatingContentLive do
  use DemoWeb, :live_view

  def mount(_params, _session, socket) do
    socket = create_cards(socket)
    {:ok, socket}
  end

  defp card(assigns) do
    ~H"""
    <div
      phx-click="toggle_card"
      phx-value-id={@id}
      class="w-full mx-2 p-2 rounded-lg bg-white border border-gray-300"
    >
      <div>
        <.expander expanded={@expanded} />
        <span class="text-lg font-medium m-1">{@title}</span>
      </div>
      <p :if={@expanded} class="text-sm">{@content}</p>
    </div>
    """
  end

  defp expander(assigns) do
    ~H"""
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class={"h-5 w-5 transition-transform duration-200 #{if @expanded, do: "rotate-180", else: ""} inline-block"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
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
