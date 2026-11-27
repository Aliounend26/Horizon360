import { Schema, model, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  description?: string;
  defaultPricePerDay?: number;
  status: 'active' | 'inactive';
}

const zoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    defaultPricePerDay: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Zone = model<IZone>('Zone', zoneSchema);
