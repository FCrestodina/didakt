import mongoose, { Schema } from 'mongoose';

const blockSchema = new Schema({}, { strict: false, _id: false });

const lessonSchema = new Schema({
  id: String,
  title: String,
  blocks: [blockSchema],
}, { _id: false });

const courseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  theme: {
    primaryColor: { type: String, default: '#6366f1' },
    fontFamily: { type: String, default: 'Inter' },
  },
  lessons: [lessonSchema],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
}, { timestamps: true });

export default mongoose.models.Course ?? mongoose.model('Course', courseSchema);
