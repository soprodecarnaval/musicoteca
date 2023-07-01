defmodule Musicoteca.FileSystemStorage.Test do
  use ExUnit.Case
  alias Musicoteca.FileSystemStorage
  alias Musicoteca.Models

  test "read" do
    # TODO: add parts
    want =
      {[
         %Models.Tag{
           name: "fanfarras"
         },
         %Models.Song{
           name: "buyo",
           tags: [
             %Models.Tag{
               name: "fanfarras"
             }
           ]
         },
         %Models.ArrangementFile{
           arrangement: %Models.Arrangement{
             name: "desconhecido",
             song: %Models.Song{
               name: "buyo"
             }
           },
           file: %Models.File{
             path:
               "/Users/beise/code/musicoteca/test/fixtures/file_system_storage_unknown_arrangement/FANFARRAS/BUYO/BUYO.mscz",
             file_type: "mscz"
           }
         }
       ], []}

    got =
      FileSystemStorage.read(
        Path.expand("../fixtures/file_system_storage_unknown_arrangement", __DIR__)
      )

    assert want = got
  end
end
