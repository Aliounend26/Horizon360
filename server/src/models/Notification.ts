import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'maintenance'
  | 'insurance'
  | 'technical_control'
  | 'rental_due'
  | 'rental_late'
  | 'payment_due'
  | 'vehicle_unavailable'
  | 'document_expiry';

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  relatedVehicle?: Types.ObjectId;
  relatedRental?: Types.ObjectId;
  read: boolean;
  targetRoles: string[];
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['maintenance', 'insurance', 'technical_control', 'rental_due', 'rental_late', 'payment_due', 'vehicle_unavailable', 'document_expiry'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    relatedVehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    relatedRental: { type: Schema.Types.ObjectId, ref: 'Rental' },
    read: { type: Boolean, default: false },
    targetRoles: { type: [String], default: ['superadmin', 'admin'] },
  },
  { timestamps: true }
);

export const Notification = model<INotification>('Notification', notificationSchema);
