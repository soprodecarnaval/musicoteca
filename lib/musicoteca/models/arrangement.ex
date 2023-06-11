defmodule Musicoteca.Models.Arrangement do
  use Ecto.Schema

  schema "arrangements" do
    field :name, :string
    belongs_to :song, Musicoteca.Models.Song
    has_many :parts, Musicoteca.Models.Part
    has_many :arrangement_files, Musicoteca.Models.ArrangementFile

    timestamps()
  end
end
