import { Schema, model, Document } from 'mongoose';

export interface ICompanySettings extends Document {
  name: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  currency: string;
  minRentalDays: number;
  defaultDeposit: number;
  lateFeePerDay: number;
  expenseCategories: string[];
  paymentMethods: string[];
}

const companySettingsSchema = new Schema<ICompanySettings>(
  {
    name: { type: String, default: 'Horizon360' },
    logoUrl: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    website: { type: String },
    currency: { type: String, default: 'FCFA' },
    minRentalDays: { type: Number, default: 1 },
    defaultDeposit: { type: Number, default: 0 },
    lateFeePerDay: { type: Number, default: 0 },
    expenseCategories: {
      type: [String],
      default: [
        'Carburant', 'Lavage', 'Vidange', 'Pneumatiques', 'Batterie', 'Assurance',
        'Réparation', 'Entretien', 'Pièces détachées', 'Contrôle technique', 'Péage', 'Autres',
      ],
    },
    paymentMethods: { type: [String], default: ['Espèces', 'Mobile Money', 'Virement', 'Carte bancaire'] },
  },
  { timestamps: true }
);

export const CompanySettings = model<ICompanySettings>('CompanySettings', companySettingsSchema);
