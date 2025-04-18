import Config

config :demo, DemoWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "WHBYUFgc9/AZbNFllO8ZmTOZYuDTgxwEEdvqQJyY5RLqvRORVi8m8jhKEZueVhHt",
  server: false

config :logger, level: :warning
config :phoenix, :plug_init_mode, :runtime
config :phoenix_live_view, enable_expensive_runtime_checks: true
