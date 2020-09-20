import mongoose from "mongoose";

const whatsappSchema = mongoose.Schema({
  name: String,
  messages: [Object],
});

export default mongoose.model("rooms", whatsappSchema);
