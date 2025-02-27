import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { removeBookId } from '../utils/localStorage';
import type { User } from '../models/User';
import { GET_ME } from '../service/queries';
import { REMOVE_BOOK } from '../service/mutations';

const SavedBooks = () => {
  // Execute the GET_ME query on component load
  const { loading, data } = useQuery(GET_ME);
  // The userData variable now holds the authenticated user data from the query
  const userData: User = data?.me || { username: '', email: '', password: '', savedBooks: [] };

  // Set up the REMOVE_BOOK mutation
  const [removeBookMutation] = useMutation(REMOVE_BOOK, {
    // Optionally, refetch the GET_ME query after mutation completes
    refetchQueries: [{ query: GET_ME }],
  });

  // Function to handle book deletion using the REMOVE_BOOK mutation
  const handleDeleteBook = async (bookId: string) => {
    try {
      await removeBookMutation({ variables: { bookId } });
      // Upon successful removal, update localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
    }
  };

  // If the query is still loading, display a loading message
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          {userData.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>
      <Container>
        <h2 className="pt-5">
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks.map((book) => (
            <Col md="4" key={book.bookId}>
              <Card border="dark">
                {book.image && (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant="top"
                  />
                )}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className="small">Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    className="btn-block btn-danger"
                    onClick={() => handleDeleteBook(book.bookId)}
                  >
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;