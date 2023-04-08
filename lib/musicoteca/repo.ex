defmodule Musicoteca.Repo do
  use Ecto.Repo,
    otp_app: :musicoteca,
    adapter: Ecto.Adapters.Postgres
end
