import { Schema, model, Document } from 'mongoose';

export interface IMaintenanceType extends Document {
  name: string;
  mileageInterval?: number;
  timeIntervalMonths?: number;
  description?: string;
}

const maintenanceTypeSchema = new Schema<IMaintenanceType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    mileageInterval: { type: Number },
    timeIntervalMonths: { type: Number },
    description: { type: String },
  },
  { timestamps: true }
);

export const MaintenanceType = model<IMaintenanceType>('MaintenanceType', maintenanceTypeSchema);
