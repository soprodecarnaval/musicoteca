defmodule Musicoteca.FileSystemStorage.Test do
  use ExUnit.Case
  alias Musicoteca.FileSystemStorage
  alias Musicoteca.Models

  test "read" do
    assert [] = FileSystemStorage.read("PARTITURAS")
  end

  @tag :skip
  test "style" do
    test_cases = [
      {"AXÉS", %Models.Tag{name: "axés"}},
      {"MARCHAS RANCHO", %Models.Tag{name: "machas rancho"}}
    ]

    Enum.each(test_cases, fn {entry, result} ->
      assert FileSystemStorage.style(entry) == result
    end)
  end
end
