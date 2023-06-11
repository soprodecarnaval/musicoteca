defmodule Musicoteca.Models.ArrangementFile do
  use Ecto.Schema

  schema "arrangement_files" do
    belongs_to(:arrangement, Musicoteca.Models.Arrangement)
    belongs_to(:file, Musicoteca.Models.File)

    timestamps()
  end
end
