import { Schema, model, Document, Types } from 'mongoose';

export interface IMaintenance extends Document {
  vehicle: Types.ObjectId;
  type: Types.ObjectId;
  lastServiceDate?: Date;
  lastServiceMileage?: number;
  nextDueDate?: Date;
  nextDueMileage?: number;
  status: 'upcoming' | 'due_soon' | 'due' | 'overdue' | 'done';
  cost?: number;
  notes?: string;
}

const maintenanceSchema = new Schema<IMaintenance>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: Schema.Types.ObjectId, ref: 'MaintenanceType', required: true },
    lastServiceDate: { type: Date },
    lastServiceMileage: { type: Number },
    nextDueDate: { type: Date },
    nextDueMileage: { type: Number },
    status: { type: String, enum: ['upcoming', 'due_soon', 'due', 'overdue', 'done'], default: 'upcoming' },
    cost: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Maintenance = model<IMaintenance>('Maintenance', maintenanceSchema);
