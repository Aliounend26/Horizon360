import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  rental: Types.ObjectId;
  amount: number;
  method: string;
  date: Date;
  note?: string;
  createdBy?: Types.ObjectId;
}

const paymentSchema = new Schema<IPayment>(
  {
    rental: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
