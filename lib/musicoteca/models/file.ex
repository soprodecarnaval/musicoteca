defmodule Musicoteca.Models.File do
  use Ecto.Schema

  schema "files" do
    field(:path, :string)
    field(:version, :integer)
    belongs_to(:prev_version, Musicoteca.Models.File)
    field(:file_type, :string)
    field(:deleted, :boolean)

    timestamps()
  end
end
