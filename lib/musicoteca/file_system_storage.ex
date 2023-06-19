## Utils for parsing a directory structure as such:
defmodule Musicoteca.FileSystemStorage do
  alias Musicoteca.Models

  @instrument_names MapSet.new([
                      "bombardino",
                      "trompete",
                      "pete",
                      "sax alto",
                      "sax tenor",
                      "sax soprano",
                      "flauta",
                      "clarinete",
                      "trombone",
                      "bone",
                      "tuba"
                    ])

  # /style/song/arrangement/file
  # /style/song/arrangement/format/song-part-page.png
  def structure do
    [
      dir: %{
        model: :style,
        children: %[
          dir: %{
            model: :song,
            children: %[
              dir: %{
                model: :arrangement,
                children: [
                  dir: %{
                    children: [
                      file: %{
                        model: :part_file,
                      }
                    ]
                  },
                  file: %{
                    model: :arrangement_file,
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  end

  def read(root_path) do
    # root has multiple style folders
    dir_each_dir(root_path, fn style_path, style_entry ->
      style_model = get_style(style_entry)
      IO.puts("style: #{style_model.name}")

      # style folder has multiple song folders
      dir_each_dir(style_path, fn song_path, song_entry ->
        song_model = get_song(song_entry, style_model)
        IO.puts("  song: #{song_model.name}")

        # song folder has multiple arrangement folders
        dir_each_dir(song_path, fn arr_path, arr_entry ->
          arr_model = get_arrangement(arr_entry, song_model)
          IO.puts("    arrg: #{arr_model.name}")

          # arrangement folders can have multiple types of file
          dir_each(arr_path, fn arr_file_path, arr_file_entry ->
            cond do
              # folders containing part files
              File.dir?(arr_file_path) ->
                dir_each(arr_file_path, fn part_file_path, part_file_entry ->
                  part_file_model = get_part_file(part_file_path, part_file_entry, arr_model)
                  part = part_file_model.part
                  inst_name = part.instrument.name
                  IO.puts("      part: #{part.name} (#{inst_name}) - #{part_file_entry}")
                end)

              # part files
              instrument_name?(Path.basename(arr_file_entry)) ->
                # TODO: make a new part_file factory instead of using this hack
                part_file_model = get_part_file(arr_file_path, "-#{arr_file_entry}-", arr_model)
                part = part_file_model.part
                inst_name = part.instrument.name
                IO.puts("      part: #{part.name} (#{inst_name}) - #{arr_file_entry}")

              # other files
              true ->
                _arr_file_model = get_arrangement_file(arr_file_path, arr_file_entry, arr_model)
                IO.puts("      file: #{arr_file_entry}")
            end
          end)
        end)
      end)
    end)
  end

  # TODO: support substring matching
  def instrument_name?(entry) do
    MapSet.member?(@instrument_names, String.downcase(entry))
  end

  def dir_each(path, process_entry) do
    case File.ls(path) do
      {:ok, entries} ->
        # TODO: reduce
        Enum.map(entries, fn entry ->
          full_path = Path.join(path, entry)
          process_entry.(full_path, entry)
        end)

      {:error, _reason} ->
        {[], ["Failed to read directory: #{path}"]}
    end
  end

  def dir_each_dir(path, process_dir) do
    dir_each(path, fn full_path, entry ->
      if File.dir?(full_path) do
        process_dir.(full_path, entry)
      else
        {[], ["Expected a directory, found file: #{full_path}"]}
      end
    end)
  end

  def get_style(entry) do
    %Models.Tag{name: String.downcase(entry)}
  end

  def get_song(entry, style) do
    %Models.Song{
      name: String.downcase(entry),
      tags: [style]
    }
  end

  def get_arrangement(entry, song) do
    %Models.Arrangement{
      name:
        entry
        |> String.split("-")
        |> Enum.at(0)
        |> String.downcase()
        |> String.split("_")
        |> Enum.join(" "),
      song: song
    }
  end

  def get_file(path, entry) do
    %Models.File{
      path: path,
      version: 0,
      file_type: List.last(String.split(entry, ".")),
      deleted: false
    }
  end

  def get_arrangement_file(path, entry, arr) do
    %Models.ArrangementFile{
      arrangement: arr,
      file: get_file(path, entry)
    }
  end

  def get_instrument(entry) do
    %Models.Instrument{
      name:
        entry
        |> String.split("-")
        |> Enum.at(1)
        |> String.downcase()
        |> String.split("_")
        |> Enum.join(" ")
    }
  end

  def get_part(entry, arr) do
    %Models.Part{
      name:
        entry
        |> String.split("-")
        |> Enum.at(1)
        |> String.downcase()
        |> String.split("_")
        |> Enum.join(" "),
      instrument: get_instrument(entry),
      arrangement: arr
    }
  end

  def get_part_file(path, entry, arr) do
    %Models.PartFile{
      part: get_part(entry, arr),
      file: get_file(path, entry)
    }
  end
end
