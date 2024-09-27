import { Button } from "react-bootstrap";

interface AddAllScoresProps {
  onAddAllScores: () => void;
  count: number;
}

const AddAllScoresButton = ({ count, onAddAllScores }: AddAllScoresProps) => {
  return (
    <Button type="button" onClick={onAddAllScores}>
      Selecionar todas ({count})
    </Button>
  );
};

export { AddAllScoresButton as AddAllSongsButton };
