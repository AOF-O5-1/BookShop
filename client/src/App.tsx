//import React from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Use a relative URL if in production
const graphqlUri = import.meta.env.PROD
  ? '/graphql'
  : 'http://localhost:3001/graphql';

const httpLink = createHttpLink({
  uri: graphqlUri,
});


// Set up an auth link to attach the token to each request.
const authLink = setContext((_, { headers }) => {
  // Retrieve the token from local storage if it exists.
  const token = localStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Create the Apollo Client instance.
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Navbar />
      <Outlet />
    </ApolloProvider>
  );
}

export default App;
