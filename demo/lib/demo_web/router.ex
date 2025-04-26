defmodule DemoWeb.Router do
  use DemoWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {DemoWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  scope "/", DemoWeb do
    pipe_through :browser

    get "/", PageController, :index
    get "/group", PageController, :group
    get "/pane", PageController, :pane
    get "/resizer", PageController, :resizer
    get "/horizontal", PageController, :horizontal
    get "/vertical", PageController, :vertical
    get "/nested", PageController, :nested
    get "/overflowing", PageController, :overflowing
    get "/collapsible", PageController, :collapsible
    get "/conditional", PageController, :conditional
    get "/persistent", PageController, :persistent
  end
end
