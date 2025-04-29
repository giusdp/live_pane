defmodule DemoWeb.PageController do
  use DemoWeb, :controller

  def index(conn, _params) do
    render(conn, :index)
  end

  def group(conn, _params) do
    render(conn, :group)
  end

  def pane(conn, _params) do
    render(conn, :pane)
  end

  def resizer(conn, _params) do
    render(conn, :resizer)
  end

  def horizontal(conn, _params) do
    render(conn, :horizontal)
  end

  def vertical(conn, _params) do
    render(conn, :vertical)
  end

  def nested(conn, _params) do
    render(conn, :nested)
  end

  def overflowing(conn, _params) do
    render(conn, :overflowing)
  end

  def conditional(conn, _params) do
    render(conn, :conditional)
  end

  def persistent(conn, _params) do
    render(conn, :persistent)
  end
end
