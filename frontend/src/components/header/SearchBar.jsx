import { Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ styles, onSearch }) => {
    return (
        <Form style={styles.search.container}>
            <InputGroup>
                <Form.Control
                    type="search"
                    placeholder="Search exercises..."
                    style={styles.search.input}
                    onChange={(e) => onSearch(e.target.value)}
                />
                <InputGroup.Text style={styles.search.icon}>
                    <FaSearch />
                </InputGroup.Text>
            </InputGroup>
        </Form>
    );
};

export default SearchBar; 