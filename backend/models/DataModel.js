import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
});

export default mongoose.model("Data", DataSchema);