import { Form } from "react-bootstrap";

interface SortProps {
  onSortBy: (column: string, direction: string) => void;
}

const Sort = ({ onSortBy } : SortProps) => {
  const handleOnClick = async (event : any) => {
    const [column, direction] = event.target.value.split('-')
    onSortBy(column, direction)
  }

  return (
    <Form.Select onChange={handleOnClick} className="mb-2">
      <option>Ordenar por</option>
      <option value="style">Estilo</option>
      <option value="title-asc">Título (A-Z)</option>
      <option value="title-desc">Título (Z-A)</option>
      <option value="arrangements-asc">Arranjo (A-Z)</option>
      <option value="arrangements-desc">Arranjo (Z-A)</option>
      <option value="tags-asc">Tags (A-Z)</option>
      <option value="tags-desc">Tags (Z-A)</option>     
    </Form.Select>
  );
}

export { Sort }
