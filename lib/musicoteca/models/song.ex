defmodule Musicoteca.Models.Song do
  use Ecto.Schema

  schema "songs" do
    field(:name, :string)
    many_to_many(:tags, Musicoteca.Tag, join_through: "song_tags")
    has_many(:arrangements, Musicoteca.Arrangement)

    timestamps()
  end
end
