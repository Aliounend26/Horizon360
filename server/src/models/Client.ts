import { Schema, model, Document } from 'mongoose';

export interface IClient extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  idNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: Date;
  licenseDocumentUrl?: string;
  notes?: string;
}

const clientSchema = new Schema<IClient>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    nationality: { type: String, trim: true },
    idNumber: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    licenseExpiryDate: { type: Date },
    licenseDocumentUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Client = model<IClient>('Client', clientSchema);
