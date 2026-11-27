import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  date: Date;
  vehicle?: Types.ObjectId;
  park?: Types.ObjectId;
  category: string;
  description?: string;
  amount: number;
  paymentMethod?: string;
  mileage?: number;
  supplier?: string;
  receiptUrl?: string;
  observation?: string;
  createdBy?: Types.ObjectId;
}

const expenseSchema = new Schema<IExpense>(
  {
    date: { type: Date, required: true, default: Date.now },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    park: { type: Schema.Types.ObjectId, ref: 'Park' },
    category: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    paymentMethod: { type: String },
    mileage: { type: Number },
    supplier: { type: String },
    receiptUrl: { type: String },
    observation: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Expense = model<IExpense>('Expense', expenseSchema);
