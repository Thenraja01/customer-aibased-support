import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(

    {
        organization_id: {
            type: String,
            unique: true

        },
        name: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
        },
        email: {
            type: String,
            maxlength: 255,
            unique: true,
            lowercase: true,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export default mongoose.model("Organization", OrganizationSchema);