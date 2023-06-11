defmodule Musicoteca.Models.Tag do
  use Ecto.Schema

  schema "tags" do
    field :name, :string

    timestamps()
  end
end
