defmodule Musicoteca.Repo.Migrations.CreateSongsAndScraperRuns do
  use Ecto.Migration

  def change do
    create table(:tags) do
      add :name, :string

      timestamps()
    end

    create table(:songs) do
      add :name, :string

      timestamps()
    end

    create table(:song_tags) do
      add :song_id, references(:songs)
      add :tag_id, references(:tags)

      timestamps()
    end

    create table(:arrangements) do
      add :name, :string
      add :song_id, references(:songs)

      timestamps()
    end

    create table(:instruments) do
      add :name, :string

      timestamps()
    end

    create table(:parts) do
      add :name, :string
      add :arrangement_id, references(:arrangements)
      add :instrument_id, references(:instruments)

      timestamps()
    end

    create table(:files) do
      add :path, :string
      add :version, :integer
      add :prev_version_id, references(:files, on_delete: :nilify_all)
      add :file_type, :string
      add :deleted, :boolean

      timestamps()
    end

    create table(:arrangement_files) do
      add :arrangement_id, references(:arrangements)
      add :file_id, references(:files)

      timestamps()
    end

    create table(:part_files) do
      add :part_id, references(:parts)
      add :file_id, references(:files)

      timestamps()
    end

    create table(:scraper_runs) do
      add :start_time, :utc_datetime
      add :end_time, :utc_datetime
      add :status, :string
      add :report, :text

      timestamps()
    end
  end
end
