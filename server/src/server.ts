import express from 'express';
import path from 'node:path';
import db from './config/connection.js';
import routes from './routes/index.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import { apolloAuthContext } from './services/auth.js'; 

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

app.use(routes);

db.once('open', async () => {
  // Create an Apollo Server instance with your schema and resolvers.
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start the Apollo Server.
  await server.start();

  // Apply Apollo Server middleware to the Express app at the '/graphql' endpoint.
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => apolloAuthContext({ req, res }),
    })
  );

  // Start the Express server.
  app.listen(PORT, () =>
    console.log(`🌍 Now listening on localhost:${PORT}`)
  );
});
