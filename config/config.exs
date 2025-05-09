import Config

config :phoenix, :json_library, Jason
config :logger, :level, :debug
config :logger, :backends, []

if Mix.env() == :dev do
  esbuild = fn args ->
    [
      args: ~w(./js/live_pane --bundle) ++ args,
      cd: Path.expand("../assets", __DIR__),
      env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
    ]
  end

  config :esbuild,
    version: "0.17.11",
    module: esbuild.(~w(--format=esm --sourcemap --outfile=../priv/static/live_pane.esm.js)),
    main: esbuild.(~w(--format=cjs --sourcemap --outfile=../priv/static/live_pane.cjs.js)),
    cdn:
      esbuild.(
        ~w(--format=iife --target=es2016 --global-name=LiveMotion --outfile=../priv/static/live_pane.js)
      ),
    cdn_min:
      esbuild.(
        ~w(--format=iife --target=es2016 --global-name=LiveMotion --minify --outfile=../priv/static/live_pane.min.js)
      )
end
