import { Rental, VehicleRate } from '../models';
import { ApiError } from '../utils/asyncHandler';
import { Types } from 'mongoose';

export function computeDays(startDate: Date, endDate: Date): number {
  const ms = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

export async function getRateForVehicleZone(vehicleId: string, zoneId: string) {
  const rate = await VehicleRate.findOne({ vehicle: vehicleId, zone: zoneId, status: 'active' });
  if (!rate) {
    throw new ApiError(400, "Aucun tarif défini pour ce véhicule dans cette zone. Configurez d'abord un tarif.");
  }
  return rate;
}

export function computeRentalAmount(opts: {
  days: number;
  ratePerDay: number;
  discount?: number;
  extraFees?: number;
}) {
  const grossAmount = opts.days * opts.ratePerDay;
  const discount = opts.discount || 0;
  const extraFees = opts.extraFees || 0;
  const totalAmount = Math.max(0, grossAmount - discount + extraFees);
  return { grossAmount, totalAmount };
}

export async function assertVehicleAvailable(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
  excludeRentalId?: string
) {
  const query: any = {
    vehicle: new Types.ObjectId(vehicleId),
    status: { $in: ['reservation', 'confirmed', 'ongoing', 'late'] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };
  if (excludeRentalId) query._id = { $ne: excludeRentalId };

  const conflict = await Rental.findOne(query);
  if (conflict) {
    throw new ApiError(409, `Véhicule déjà réservé/loué du ${conflict.startDate.toLocaleDateString()} au ${conflict.endDate.toLocaleDateString()} (location ${conflict.rentalNumber}).`);
  }
}
