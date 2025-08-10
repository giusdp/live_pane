defmodule LivePane.MixProject do
  use Mix.Project

  @version "0.6.3"

  def project do
    [
      app: :live_pane,
      version: @version,
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      package: package(),
      deps: deps(),
      docs: docs(),
      name: "Live Pane",
      source_url: "https://github.com/giusdp/live_pane",
      homepage_url: "https://github.com/giusdp/live_pane",
      description: """
      Resizable pane components for LiveView.
      """
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.8"},
      {:phoenix_live_view, "~> 1.1.0"},
      #
      {:bandit, "~> 1.5", only: :dev},
      {:credo, ">= 0.0.0", only: [:dev], runtime: false},
      {:esbuild, "~> 0.8", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.2", runtime: Mix.env() == :dev},
      {:ex_doc, ">= 0.0.0", only: :dev, runtime: false}
    ]
  end

  defp package do
    [
      maintainers: ["Giuseppe De Palma"],
      licenses: ["MIT"],
      links: %{
        Changelog: "https://hexdocs.pm/live_pane/changelog.html",
        GitHub: "https://github.com/giusdp/live_pane"
      },
      files: files()
    ]
  end

  defp files do
    ~w"""
    assets/js
    priv
    lib
    CHANGELOG.md
    LICENSE
    mix.exs
    README.md
    package.json
    """
  end

  defp docs do
    [
      main: "readme",
      extras: ["README.md", "CHANGELOG.md"],
      source_ref: "main",
      source_url: "https://github.com/giusdp/live_pane",
      skip_undefined_reference_warnings_on: ["CHANGELOG.md"]
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "cmd --cd assets npm install"],
      "assets.build": ["esbuild module", "esbuild cdn", "esbuild cdn_min", "esbuild main"],
      "assets.watch": ["esbuild module --watch"]
    ]
  end
end
