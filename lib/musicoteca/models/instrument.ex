defmodule Musicoteca.Models.Instrument do
  use Ecto.Schema

  schema "instruments" do
    field :name, :string

    timestamps()
  end
end
