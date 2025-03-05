import { AuthenticationError } from 'apollo-server-errors';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';

const resolvers = {
  Query: {
    // Returns the currently authenticated user.
    me: async (
      _parent: any,
      { id, username }: { id?: string; username?: string },
      context: { user?: any }
    ) => {
      try {
        const userId = id || (context.user && context.user._id);
        const foundUser = await User.findOne({
          $or: [{ _id: userId }, { username }],
        });
        if (!foundUser) {
          throw new Error('Cannot find a user with the provided id or username!');
        }
        return foundUser;
      } catch (error) {
        console.error('Error in Query.me:', error);
        throw error;
      }
    },
  },
  Mutation: {
    // Renamed from "createUser" to "addUser" to match the schema.
    addUser: async (
      _parent: any,
      args: { username: string; email: string; password: string }
    ) => {
      try {
        const user = await User.create(args);
        if (!user) {
          throw new Error('Something went wrong while creating the user!');
        }
        const token = signToken(user.username, user.email, user._id);
        return { token, user };
      } catch (error) {
        console.error('Error in Mutation.addUser:', error);
        throw error;
      }
    },
    // Renamed from "login" to "loginUser" to match the schema.
    loginUser: async (
      _parent: any,
      args: { username?: string; email?: string; password: string }
    ) => {
      try {
        const user = await User.findOne({
          $or: [{ username: args.username }, { email: args.email }],
        });
        if (!user) {
          throw new Error("Can't find this user");
        }
        const correctPw = await user.isCorrectPassword(args.password);
        if (!correctPw) {
          throw new Error('Wrong password!');
        }
        const token = signToken(user.username, user.email, user._id);
        return { token, user };
      } catch (error) {
        console.error('Error in Mutation.loginUser:', error);
        throw error;
      }
    },
    // saveBook matches the schema.
    saveBook: async (
      _parent: any,
      { book }: { book: any },
      context: { user?: any }
    ) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You need to be logged in!');
        }
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (error) {
        console.error('Error in Mutation.saveBook:', error);
        throw error;
      }
    },
    // Renamed from "deleteBook" to "removeBook" to match the schema.
    removeBook: async (
      _parent: any,
      { bookId }: { bookId: string },
      context: { user?: any }
    ) => {
      try {
        if (!context.user) {
          throw new AuthenticationError('You need to be logged in!');
        }
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        if (!updatedUser) {
          throw new Error("Couldn't find a user with this id!");
        }
        return updatedUser;
      } catch (error) {
        console.error('Error in Mutation.removeBook:', error);
        throw error;
      }
    },
  },
};

export default resolvers;
