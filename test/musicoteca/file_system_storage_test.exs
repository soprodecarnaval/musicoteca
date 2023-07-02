defmodule Musicoteca.FileSystemStorage.Test do
  use ExUnit.Case
  alias Musicoteca.FileSystemStorage

  alias Musicoteca.Models.{
    Arrangement,
    ArrangementFile,
    File,
    Instrument,
    Part,
    PartFile,
    Song,
    Tag
  }

  def get_fixture_folder(name) do
    Path.join([__DIR__, "..", "fixtures", "file_system_storage", name])
  end

  describe "ignored_file_prefix?/1" do
    test "true" do
      inputs = [
        ".DS_Store",
        ".gitignore",
        ".gitkeep",
        ".git",
        ".",
        "..",
        "._.DS_Store",
        "._.gitignore",
        "._.gitkeep",
        "._.git",
        "._",
        "._..",
        "._._.DS_Store",
        "._._.gitignore",
        "._._.gitkeep",
        "._._.git",
        "._._",
        "._._.."
      ]

      Enum.each(inputs, fn input ->
        assert FileSystemStorage.ignored_file_prefix?(input)
      end)
    end

    test "false" do
      inputs = [
        "somefile.mscz",
        "anotherfile.pdf",
        "anything.png"
      ]

      Enum.each(inputs, fn input ->
        refute FileSystemStorage.ignored_file_prefix?(input)
      end)
    end
  end

  describe "part_file_extension?/1" do
    test "valid" do
      inputs = [
        "PNG",
        "png",
        "PDF",
        "pdf"
      ]

      Enum.each(inputs, fn input ->
        assert FileSystemStorage.part_file_extension?(input)
      end)
    end

    test "invalid" do
      inputs = [
        "tex",
        "docx",
        "txt",
        ""
      ]

      Enum.each(inputs, fn input ->
        refute FileSystemStorage.part_file_extension?(input)
      end)
    end
  end

  describe "find_insturment_name/1" do
    test "found a name" do
      assert {:ok, "sax tenor", "sax tenor"} =
               FileSystemStorage.find_instrument_name(["buyo", "sax tenor", "1.png"])
    end

    test "found an alias" do
      assert {:ok, "pete", "trompete"} =
               FileSystemStorage.find_instrument_name(["buyo", "pete", "1.png"])
    end

    test "not found" do
      assert {:error, :no_instrument_name} =
               FileSystemStorage.find_instrument_name(["buyo", "celular", "1.png"])
    end
  end

  describe "read/1" do
    test "empty folder" do
      want = {[], []}

      got = FileSystemStorage.read(get_fixture_folder("empty_folder"))

      assert want == got
    end

    test "ignore underscore-prefixed folders" do
      assert {[
                %Tag{name: "festa junina"}
              ],
              [
                {:ignored_entry, ".DS_Store", _},
                {:ignored_entry, ".DS_Store", _},
                {:ignored_entry, "_CADERNINHOS", _}
              ]} = FileSystemStorage.read(get_fixture_folder("underscore_folders"))
    end

    test "known arrangement" do
      assert {
               [
                 %Tag{name: "cirandas"},
                 %Song{name: "nagô nagô", tags: [%Tag{name: "cirandas"}]},
                 %Arrangement{
                   name: "carnaval bh 2023 - nago nago",
                   song: %Song{name: "nagô nagô", tags: [%Tag{name: "cirandas"}]}
                 },
                 %ArrangementFile{
                   arrangement: %Arrangement{
                     name: "carnaval bh 2023 - nago nago",
                     song: %Song{name: "nagô nagô", tags: [%Tag{name: "cirandas"}]}
                   },
                   file: %File{file_type: "mscz"}
                 },
                 %PartFile{
                   file: %File{file_type: "png"},
                   part: %Part{
                     name: "bone",
                     arrangement: %Arrangement{
                       name: "carnaval bh 2023 - nago nago",
                       song: %Song{
                         name: "nagô nagô",
                         tags: [%Tag{name: "cirandas"}]
                       }
                     },
                     instrument: %Instrument{name: "trombone"}
                   }
                 },
                 %PartFile{
                   file: %File{file_type: "png"},
                   part: %Part{
                     name: "flauta",
                     arrangement: %Arrangement{
                       name: "carnaval bh 2023 - nago nago",
                       song: %Song{
                         name: "nagô nagô",
                         tags: [%Tag{name: "cirandas"}]
                       }
                     },
                     instrument: %Instrument{name: "flauta"}
                   }
                 },
                 %PartFile{
                   file: %File{file_type: "png"},
                   part: %Part{
                     name: "pete",
                     arrangement: %Arrangement{
                       name: "carnaval bh 2023 - nago nago",
                       song: %Song{
                         name: "nagô nagô",
                         tags: [%Tag{name: "cirandas"}]
                       }
                     },
                     instrument: %Instrument{name: "trompete"}
                   }
                 },
                 %PartFile{
                   file: %File{file_type: "png"},
                   part: %Part{
                     name: "sax alto",
                     arrangement: %Arrangement{
                       name: "carnaval bh 2023 - nago nago",
                       song: %Song{
                         name: "nagô nagô",
                         tags: [%Tag{name: "cirandas"}]
                       }
                     },
                     instrument: %Instrument{name: "sax alto"}
                   }
                 },
                 %PartFile{
                   file: %File{file_type: "png"},
                   part: %Part{
                     name: "sax tenor",
                     arrangement: %Arrangement{
                       name: "carnaval bh 2023 - nago nago",
                       song: %Song{
                         name: "nagô nagô",
                         tags: [%Tag{name: "cirandas"}]
                       }
                     },
                     instrument: %Instrument{name: "sax tenor"}
                   }
                 }
               ],
               [
                 {:ignored_entry, ".DS_Store", _},
                 {:ignored_entry, ".DS_Store", _},
                 {:ignored_entry, ".DS_Store", _},
                 {:ignored_entry, ".DS_Store", _}
               ]
             } = FileSystemStorage.read(get_fixture_folder("known_arrangement"))
    end

    test "unknown arrangement" do
      assert {[
                %Tag{
                  name: "fanfarras"
                },
                %Song{
                  name: "buyo",
                  tags: [
                    %Tag{
                      name: "fanfarras"
                    }
                  ]
                },
                %ArrangementFile{
                  arrangement: %Arrangement{
                    name: "desconhecido",
                    song: %Song{
                      name: "buyo"
                    }
                  },
                  file: %File{
                    file_type: "mscz"
                  }
                },
                %Arrangement{
                  name: "desconhecido",
                  song: %Song{name: "buyo", tags: [%Tag{name: "fanfarras"}]}
                },
                %PartFile{
                  part: %Part{
                    name: "bone",
                    arrangement: %Arrangement{
                      name: "desconhecido",
                      song: %Song{name: "buyo", tags: [%Tag{name: "fanfarras"}]}
                    },
                    instrument: %Instrument{name: "trombone"}
                  },
                  file: %File{file_type: "png"}
                },
                %PartFile{
                  part: %Part{
                    name: "flauta",
                    arrangement: %Arrangement{
                      name: "desconhecido",
                      song: %Song{name: "buyo", tags: [%Tag{name: "fanfarras"}]}
                    },
                    instrument: %Instrument{name: "flauta"}
                  },
                  file: %File{file_type: "png"}
                },
                %PartFile{
                  part: %Part{
                    name: "pete",
                    arrangement: %Arrangement{
                      name: "desconhecido",
                      song: %Song{name: "buyo", tags: [%Tag{name: "fanfarras"}]}
                    },
                    instrument: %Instrument{name: "trompete"}
                  },
                  file: %File{file_type: "png"}
                },
                %PartFile{
                  part: %Part{
                    name: "sax alto",
                    arrangement: %Arrangement{
                      name: "desconhecido",
                      song: %Song{name: "buyo", tags: [%Tag{name: "fanfarras"}]}
                    },
                    instrument: %Instrument{name: "sax alto"}
                  },
                  file: %File{file_type: "png"}
                },
                %PartFile{
                  part: %Part{
                    name: "sax tenor",
                    arrangement: %Arrangement{
                      name: "desconhecido",
                      song: %Song{name: "buyo", tags: [%Tag{name: "fanfarras"}]}
                    },
                    instrument: %Instrument{name: "sax tenor"}
                  },
                  file: %File{file_type: "png"}
                }
              ],
              [
                {:ignored_entry, ".DS_Store", _},
                {:ignored_entry, ".DS_Store", _},
                {:ignored_entry, ".DS_Store", _}
              ]} = FileSystemStorage.read(get_fixture_folder("unknown_arrangement"))
    end
  end
end
