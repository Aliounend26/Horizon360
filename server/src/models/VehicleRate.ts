import { Schema, model, Document, Types } from 'mongoose';

export interface IVehicleRate extends Document {
  vehicle: Types.ObjectId;
  zone: Types.ObjectId;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  weekendPrice?: number;
  deposit?: number;
  status: 'active' | 'inactive';
}

const vehicleRateSchema = new Schema<IVehicleRate>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
    pricePerDay: { type: Number, required: true },
    pricePerWeek: { type: Number },
    pricePerMonth: { type: Number },
    weekendPrice: { type: Number },
    deposit: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

vehicleRateSchema.index({ vehicle: 1, zone: 1 }, { unique: true });

export const VehicleRate = model<IVehicleRate>('VehicleRate', vehicleRateSchema);
