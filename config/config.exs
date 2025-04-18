import Config

config :phoenix, :json_library, Jason
config :logger, :level, :debug
config :logger, :backends, []

if Mix.env() == :dev do
  config :esbuild,
    version: "0.17.11",
    live_pane: [
      args:
        ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
      cd: Path.expand("../assets", __DIR__),
      env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
    ]
end
