import { Schema, model, Document, Types } from 'mongoose';

export interface IPark extends Document {
  name: string;
  description?: string;
  location?: string;
  manager?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  assignedUsers: Types.ObjectId[];
}

const parkSchema = new Schema<IPark>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    manager: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    imageUrl: { type: String },
    assignedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Park = model<IPark>('Park', parkSchema);
