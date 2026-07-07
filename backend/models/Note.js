import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['admin', 'faculty'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      enum: ['blue', 'yellow', 'green', 'red'],
      default: 'blue',
    },
    author: {
      type: String,
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['admin', 'faculty'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ type: 1, createdAt: -1 });
noteSchema.index({ authorRole: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;