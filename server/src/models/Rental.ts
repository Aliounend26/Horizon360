import { Schema, model, Document, Types } from 'mongoose';

export type RentalStatus = 'reservation' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'late';

export interface IRental extends Document {
  rentalNumber: string;
  client: Types.ObjectId;
  vehicle: Types.ObjectId;
  park: Types.ObjectId;
  zone: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  days: number;
  ratePerDay: number;
  grossAmount: number;
  discount: number;
  extraFees: number;
  deposit: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod?: string;
  status: RentalStatus;
  mileageStart?: number;
  mileageEnd?: number;
  kmDriven?: number;
  observations?: string;
  createdBy?: Types.ObjectId;
}

const rentalSchema = new Schema<IRental>(
  {
    rentalNumber: { type: String, required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    park: { type: Schema.Types.ObjectId, ref: 'Park', required: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    actualReturnDate: { type: Date },
    days: { type: Number, required: true },
    ratePerDay: { type: Number, required: true },
    grossAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    extraFees: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    paymentMethod: { type: String },
    status: { type: String, enum: ['reservation', 'confirmed', 'ongoing', 'completed', 'cancelled', 'late'], default: 'reservation' },
    mileageStart: { type: Number },
    mileageEnd: { type: Number },
    kmDriven: { type: Number },
    observations: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

rentalSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });

export const Rental = model<IRental>('Rental', rentalSchema);
