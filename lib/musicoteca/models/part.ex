defmodule Musicoteca.Models.Part do
  use Ecto.Schema

  schema "parts" do
    field(:name, :string)
    belongs_to(:arrangement, Musicoteca.Models.Arrangement)
    belongs_to(:instrument, Musicoteca.Models.Instrument)
    has_many(:part_files, Musicoteca.Models.PartFile)

    timestamps()
  end
end
