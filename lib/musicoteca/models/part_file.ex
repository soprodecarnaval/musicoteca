defmodule Musicoteca.Models.PartFile do
  use Ecto.Schema

  schema "part_files" do
    belongs_to(:part, Musicoteca.Models.Part)
    belongs_to(:file, Musicoteca.Models.File)

    timestamps()
  end
end
