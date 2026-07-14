import mongoose from "mongoose";
import env from'./env.js'
// import User from '../schema/user.schema.js';
 const dbconnection = async () => {
    try {
        const connection = await mongoose.connect(
            env.MONGODB_URI
        )
        console.log(`MongoDB connected: ${connection.connection.host}`);


    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
}
export default dbconnection;