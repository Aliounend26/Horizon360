import { Schema, model, Document, Types } from 'mongoose';

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'unavailable' | 'archived';

export interface IVehicle extends Omit<Document, 'model'> {
  park: Types.ObjectId;
  brand: string;
  model: string;
  year?: number;
  plateNumber: string;
  vin?: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  mileage: number;
  mileageAtPurchase?: number;
  acquisitionDate?: Date;
  acquisitionPrice?: number;
  status: VehicleStatus;
  insuranceProvider?: string;
  insuranceExpiryDate?: Date;
  technicalControlExpiryDate?: Date;
  registrationCardNumber?: string;
  notes?: string;
  photoUrl?: string;
  gallery: string[];
}

const vehicleSchema = new Schema<IVehicle>(
  {
    park: { type: Schema.Types.ObjectId, ref: 'Park', required: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number },
    plateNumber: { type: String, required: true, unique: true, trim: true },
    vin: { type: String, trim: true },
    color: { type: String, trim: true },
    fuelType: { type: String, trim: true },
    transmission: { type: String, trim: true },
    seats: { type: Number },
    mileage: { type: Number, default: 0 },
    mileageAtPurchase: { type: Number },
    acquisitionDate: { type: Date },
    acquisitionPrice: { type: Number },
    status: { type: String, enum: ['available', 'rented', 'maintenance', 'unavailable', 'archived'], default: 'available' },
    insuranceProvider: { type: String, trim: true },
    insuranceExpiryDate: { type: Date },
    technicalControlExpiryDate: { type: Date },
    registrationCardNumber: { type: String, trim: true },
    notes: { type: String },
    photoUrl: { type: String },
    gallery: { type: [String], default: [] },
  },
  { timestamps: true }
);

vehicleSchema.virtual('displayName').get(function (this: IVehicle) {
  return `${this.brand} ${this.model}`;
});
vehicleSchema.set('toJSON', { virtuals: true });

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
