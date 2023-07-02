## Utils for parsing a directory structure as such:
defmodule Musicoteca.FileSystemStorage do
  alias Musicoteca.Models

  @instrument_names %{
    "bombardino" => "bombardino",
    "clarinete" => "clarinete",
    "flauta" => "flauta",
    "sax alto" => "sax alto",
    "sax soprano" => "sax soprano",
    "sax tenor" => "sax tenor",
    "trombone" => "trombone",
    "bone" => "trombone",
    "trompete" => "trompete",
    "pete" => "trompete",
    "tuba" => "tuba"
  }

  @part_file_extensions MapSet.new([
                          "pdf",
                          "jpg",
                          "jpeg",
                          "png"
                        ])

  @ignore_entry_prefixes [".", "_"]

  def read(root_path) do
    structure = [
      # /style/
      dir: %{
        model: :style,
        children: [
          # /style/song/
          dir: %{
            model: :song,
            children: [
              # /style/song/format/
              dir: %{
                # format can be "PNG", ".PNG", etc.
                test: &part_file_extension?/1,
                model: :unknown_arrangement,
                children: [
                  # /style/song/format/part.*
                  file: %{model: :part_file}
                ]
              },
              # /style/song/file.*
              file: %{
                model: :unknown_arrangement_file
              },
              # /style/song/arrangement/
              dir: %{
                # any other string is considered an arrangement
                model: :arrangement,
                children: [
                  # /style/song/arrangement/format/
                  dir: %{
                    test: &part_file_extension?/1,
                    children: [
                      # /style/song/arrangement/format/part.*
                      file: %{model: :part_file}
                    ]
                  },
                  # /style/song/arrangement/file.*
                  file: %{model: :arrangement_file}
                ]
              }
            ]
          }
        ]
      }
    ]

    read_directory(root_path, structure)
  end

  def read_directory(path, structure) do
    read_directory(path, structure, %{})
  end

  def read_directory(path, structure, parent_models) do
    case list_dir(path) do
      {:ok, entries} ->
        IO.puts("")

        entries
        # [entry_a, entry_b] -> [{models_a, errors_a}, {models_b, errors_b}]
        |> Enum.map(&read_entry(Path.join(path, &1), &1, structure, parent_models))
        # [{models_a, errors_a}, {models_b, errors_b}] -> {[models_a, models_b], [errors_a, errors_b]}
        |> Enum.unzip()
        # {[models_a, models_b], [errors_a, errors_b]} -> [[models_a, models_b], [errors_a, errors_b]]
        |> Tuple.to_list()
        # [[models_a, models_b], [errors_a, errors_b]] -> [all_models, all_errors]
        |> Enum.map(&List.flatten/1)
        # [all_models, all_errors] -> { all_models, all_errors }
        |> List.to_tuple()

      {:error, _} ->
        {[], [{:cant_list_dir, path}]}
    end
  end

  # read_entry will read a single entry in the directory structure,
  # trying to match it with the structure defined in the structure
  def read_entry(path, _entry, [], _parent_models) do
    {[], [{:unknown_entry, path}]}
  end

  def read_entry(path, entry, [h | t], parent_models) do
    cond do
      ignored_file_prefix?(entry) ->
        {[], [{:ignored_entry, entry, path}]}

      entry_matches_node?(h, path, entry) ->
        read_node(h, path, entry, parent_models)

      true ->
        read_entry(path, entry, t, parent_models)
    end
  end

  def entry_matches_node?({:dir, node_def}, path, entry) do
    File.dir?(path) and matches_node_def?(node_def, entry)
  end

  def entry_matches_node?({:file, node_def}, path, entry) do
    not File.dir?(path) and matches_node_def?(node_def, entry)
  end

  def matches_node_def?(%{test: test}, entry), do: test.(entry)
  def matches_node_def?(_, _), do: true

  # File with model
  def read_node({:file, %{model: model_type}}, path, entry, parent_models) do
    case get_model(model_type, entry, parent_models, path) do
      {:ok, model} ->
        {[model], []}

      {:error, error} ->
        {[], [error]}
    end
  end

  # Directory with model
  def read_node(
        {:dir, %{model: model_type, children: children}},
        path,
        entry,
        parent_models
      ) do
    case get_model(model_type, entry, parent_models, path) do
      {:ok, dir_model} ->
        dir_parent_models = Map.put(parent_models, dir_model.__struct__, dir_model)
        {child_models, child_errs} = read_directory(path, children, dir_parent_models)
        {[dir_model | child_models], child_errs}

      {:error, error} ->
        {[], [{error, model_type, path}]}
    end
  end

  # Directory without model
  def read_node(
        {:dir, %{children: children}},
        path,
        entry,
        parent_models
      ) do
    read_directory(path, children, parent_models)
  end

  def get_model(:style, entry, _parent_models, _path) do
    {:ok, %Models.Tag{name: String.downcase(entry)}}
  end

  def get_model(:song, entry, parent_models, _path) do
    with {:ok, style} <- get_parent_model(parent_models, Models.Tag) do
      {:ok,
       %Models.Song{
         name: String.downcase(entry),
         tags: [style]
       }}
    end
  end

  def get_model(:arrangement, entry, parent_models, _path) do
    with {:ok, song} <- get_parent_model(parent_models, Models.Song) do
      {:ok,
       %Models.Arrangement{
         name: String.downcase(entry),
         song: song
       }}
    end
  end

  def get_model(:unknown_arrangement, _entry, parent_models, _path) do
    with {:ok, song} <- get_parent_model(parent_models, Models.Song) do
      {:ok,
       %Models.Arrangement{
         name: "desconhecido",
         song: song
       }}
    end
  end

  def get_model(:file, entry, _parent_models, path) do
    with filetype <- file_extension(entry) do
      {:ok,
       %Models.File{
         path: path,
         version: 0,
         file_type: filetype,
         deleted: false
       }}
    end
  end

  def get_model(:part_file, entry, parent_models, path) do
    with {:ok, part} <- get_model(:part, entry, parent_models, path),
         {:ok, file} <- get_model(:file, entry, parent_models, path) do
      {:ok,
       %Models.PartFile{
         part: part,
         file: file
       }}
    end
  end

  def get_model(:unknown_arrangement_file, entry, parent_models, path) do
    # TODO: This is a hack to get the unknown arrangement
    #       We should have a better way to do this, like using a default arrangement for a song
    with {:ok, arrangement} <- get_model(:unknown_arrangement, entry, parent_models, path),
         {:ok, file} <- get_model(:file, entry, parent_models, path) do
      {:ok,
       %Models.ArrangementFile{
         arrangement: arrangement,
         file: file
       }}
    end
  end

  def get_model(:arrangement_file, entry, parent_models, path) do
    with {:ok, arrangement} <- get_parent_model(parent_models, Models.Arrangement),
         {:ok, file} <- get_model(:file, entry, parent_models, path) do
      {:ok,
       %Models.ArrangementFile{
         arrangement: arrangement,
         file: file
       }}
    end
  end

  def get_model(:part, entry, parent_models, path) do
    with {:ok, arr} <- get_parent_model(parent_models, Models.Arrangement),
         {:ok, part_name, _} <- find_instrument_name_in_filename(entry),
         {:ok, instrument} <- get_model(:instrument, entry, parent_models, path) do
      {:ok,
       %Models.Part{
         name: part_name,
         instrument: instrument,
         arrangement: arr
       }}
    end
  end

  def get_model(:instrument, entry, _parent_models, _path) do
    # buyo-sax_tenor-1.png
    with {:ok, _, normalized_name} <- find_instrument_name_in_filename(entry) do
      {:ok, %Models.Instrument{name: normalized_name}}
    else
      err ->
        {:error, {:no_instrument_name, entry}}
    end
  end

  def get_parent_model(models, model_type) do
    case Map.get(models, model_type) do
      nil ->
        {:error, {:no_parent_model, model_type}}

      model ->
        {:ok, model}
    end
  end

  def instrument_name(entry) do
    @instrument_names[String.downcase(entry)]
  end

  # finds an instrument name within a list of strings
  def find_instrument_name(str_list) do
    case Enum.find(str_list, nil, &instrument_name/1) do
      nil ->
        {:error, :no_instrument_name}

      name ->
        {:ok, name, @instrument_names[name]}
    end
  end

  def find_instrument_name_in_filename(filename) do
    with {:ok, filename_parts} = parse_filename(filename) do
      find_instrument_name(filename_parts)
    end
  end

  def ok(value) do
    {:ok, value}
  end

  def parse_filename(entry) do
    entry
    |> String.split("-")
    |> Enum.map(fn part ->
      part
      |> String.downcase()
      |> String.split("_")
      |> Enum.join(" ")
    end)
    |> ok()
  end

  def file_extension(entry) do
    entry
    |> String.split(".")
    |> Enum.at(-1)
  end

  def ignored_file_prefix?(entry) do
    Enum.any?(@ignore_entry_prefixes, fn prefix ->
      String.starts_with?(entry, prefix)
    end)
  end

  def part_file_extension?(entry) do
    normalized =
      entry
      |> String.trim(".")
      |> String.downcase()

    MapSet.member?(@part_file_extensions, normalized)
  end

  def list_dir(path) do
    case File.ls(path) do
      {:ok, entries} ->
        {:ok, entries |> Enum.sort()}

      {:error, error} ->
        {:error, error}
    end
  end
end
