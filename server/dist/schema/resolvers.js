import { AuthenticationError } from 'apollo-server-errors';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';
const resolvers = {
    Query: {
        // Returns the currently authenticated user.
        me: async (_parent, { id, username }, context) => {
            const userId = id || (context.user && context.user._id);
            const foundUser = await User.findOne({
                $or: [{ _id: userId }, { username }],
            });
            if (!foundUser) {
                throw new Error('Cannot find a user with the provided id or username!');
            }
            return foundUser;
        },
    },
    Mutation: {
        // Renamed from "createUser" to "addUser" to match the schema.
        addUser: async (_parent, args) => {
            const user = await User.create(args);
            if (!user) {
                throw new Error('Something went wrong while creating the user!');
            }
            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },
        // Renamed from "login" to "loginUser" to match the schema.
        loginUser: async (_parent, args) => {
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
            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },
        // saveBook matches the schema.
        saveBook: async (_parent, { book }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            const updatedUser = await User.findOneAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: book } }, { new: true, runValidators: true });
            return updatedUser;
        },
        // Renamed from "deleteBook" to "removeBook" to match the schema.
        removeBook: async (_parent, { bookId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            const updatedUser = await User.findOneAndUpdate({ _id: context.user._id }, { $pull: { savedBooks: { bookId } } }, { new: true });
            if (!updatedUser) {
                throw new Error("Couldn't find a user with this id!");
            }
            return updatedUser;
        },
    },
};
export default resolvers;
