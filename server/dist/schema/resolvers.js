import { AuthenticationError } from 'apollo-server-errors';
import User from '../models/User';
import { signToken } from '../services/auth';
// GraphQL resolvers implementation
const resolvers = {
    Query: {
        // Fetch a single user by id or username. If id is not provided,
        // fallback to the id in the authenticated context.
        getSingleUser: async (_parent, { id, username }, context) => {
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
        // Create a new user, sign a JWT, and return both the token and user.
        createUser: async (_parent, args) => {
            const user = await User.create(args);
            if (!user) {
                throw new Error('Something went wrong while creating the user!');
            }
            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },
        // Log in an existing user by username or email and return a signed token.
        login: async (_parent, args) => {
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
        // Save a book to the authenticated user's savedBooks list.
        saveBook: async (_parent, { book }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in!');
            }
            const updatedUser = await User.findOneAndUpdate({ _id: context.user._id }, { $addToSet: { savedBooks: book } }, { new: true, runValidators: true });
            return updatedUser;
        },
        // Remove a book from the authenticated user's savedBooks list.
        deleteBook: async (_parent, { bookId }, context) => {
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
