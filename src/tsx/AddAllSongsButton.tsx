import { Button } from "react-bootstrap";

interface AddAllSongsProps {
  onAddAllSongs: () => void;
}

const AddAllSongsButton = ({ onAddAllSongs }: AddAllSongsProps) => {
  return (
    <Button
      type="button"
      onClick={onAddAllSongs}
    >
      Selecionar todas
    </Button>
  );
};

export { AddAllSongsButton };