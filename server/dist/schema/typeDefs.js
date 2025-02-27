import { gql } from 'apollo-server-express';
const typeDefs = gql `
  type Query {
    # Returns the currently authenticated user.
    me: User
  }

  type Mutation {
    # Log in a user by providing email and password; returns an Auth type.
    loginUser(email: String!, password: String!): Auth

    # Create a new user; returns an Auth type.
    addUser(username: String!, email: String!, password: String!): Auth

    # Save a book to the user's savedBooks list; returns the updated User.
    saveBook(book: BookInput!): User

    # Remove a book (by its bookId) from the user's savedBooks list; returns the updated User.
    removeBook(bookId: String!): User
  }

  # The User type represents a user in the system.
  type User {
    _id: ID!
    username: String!
    email: String!
    bookCount: Int
    savedBooks: [Book]
  }

  # The Book type represents a book saved by a user.
  type Book {
    bookId: String!
    authors: [String]
    description: String
    title: String!
    image: String
    link: String
  }

  # The Auth type is returned upon login or user creation, providing a token and user data.
  type Auth {
    token: String!
    user: User!
  }

  # Input type for passing book details to the saveBook mutation.
  input BookInput {
    authors: [String]
    description: String
    title: String!
    bookId: String!
    image: String
    link: String
  }
`;
export default typeDefs;
