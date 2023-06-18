defmodule Musicoteca.FolderStorage.Test do
  use ExUnit.Case
  alias Musicoteca.FolderStorage
  alias Musicoteca.Models

  test "read" do
    assert [] = FolderStorage.read("PARTITURAS")
  end

  @tag :skip
  test "style" do
    test_cases = [
      {"AXÉS", %Models.Tag{name: "axés"}},
      {"MARCHAS RANCHO", %Models.Tag{name: "machas rancho"}}
    ]

    Enum.each(test_cases, fn {entry, result} ->
      assert FolderStorage.style(entry) == result
    end)
  end
end
