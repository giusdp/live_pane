import Config

config :demo, DemoWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "6W58PZYHRUb8TMuxZC22+0AwEDHxST3dUQ7y7BVZmtX/aKeqEqVXa5WbfdXCG7iu",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:demo, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:demo, ~w(--watch)]}
  ]

config :demo, DemoWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"lib/demo_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

config :phoenix, :stacktrace_depth, 20

config :phoenix, :plug_init_mode, :runtime

config :phoenix_live_view,
  debug_heex_annotations: true,
  enable_expensive_runtime_checks: true
