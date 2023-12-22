import { Button } from "react-bootstrap";

interface AddAllSongsProps {
  onAddAllSongs: () => void;
  count: number;
}

const AddAllSongsButton = ({ count, onAddAllSongs }: AddAllSongsProps) => {
  return (
    <Button
      type="button"
      onClick={onAddAllSongs}
    >
      Selecionar todas ({count})
    </Button>
  );
};

export { AddAllSongsButton };