import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Adebanjo:AtP1NxzKBqW0vHuJ@cluster05-13.p3mce.mongodb.net/?retryWrites=true&w=majority&appName=Cluster05-13');
export default mongoose.connection;
