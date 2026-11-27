import { Rental, Expense, Vehicle, Maintenance } from '../models';
import { Types } from 'mongoose';

export interface DashboardFilters {
  from?: Date;
  to?: Date;
  park?: string;
  vehicle?: string;
  zone?: string;
  status?: string;
  allowedParkIds?: string[];
}

function buildRentalMatch(filters: DashboardFilters) {
  const match: any = {};
  if (filters.from || filters.to) {
    match.startDate = {};
    if (filters.from) match.startDate.$gte = filters.from;
    if (filters.to) match.startDate.$lte = filters.to;
  }
  if (filters.park) match.park = new Types.ObjectId(filters.park);
  else if (filters.allowedParkIds) match.park = { $in: filters.allowedParkIds.map((id) => new Types.ObjectId(id)) };
  if (filters.vehicle) match.vehicle = new Types.ObjectId(filters.vehicle);
  if (filters.zone) match.zone = new Types.ObjectId(filters.zone);
  if (filters.status) match.status = filters.status;
  return match;
}

function buildExpenseMatch(filters: DashboardFilters) {
  const match: any = {};
  if (filters.from || filters.to) {
    match.date = {};
    if (filters.from) match.date.$gte = filters.from;
    if (filters.to) match.date.$lte = filters.to;
  }
  if (filters.park) match.park = new Types.ObjectId(filters.park);
  else if (filters.allowedParkIds) match.park = { $in: filters.allowedParkIds.map((id) => new Types.ObjectId(id)) };
  if (filters.vehicle) match.vehicle = new Types.ObjectId(filters.vehicle);
  return match;
}

export async function getDashboardSummary(filters: DashboardFilters) {
  const rentalMatch = buildRentalMatch(filters);
  const expenseMatch = buildExpenseMatch(filters);

  const [revenueAgg] = await Rental.aggregate([
    { $match: { ...rentalMatch, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, revenue: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' }, days: { $sum: '$days' }, count: { $sum: 1 } } },
  ]);

  const [expenseAgg] = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const revenue = revenueAgg?.revenue || 0;
  const expensesTotal = expenseAgg?.total || 0;
  const netProfit = revenue - expensesTotal;

  const vehicleFilter: any = {};
  if (filters.park) vehicleFilter.park = new Types.ObjectId(filters.park);
  else if (filters.allowedParkIds) vehicleFilter.park = { $in: filters.allowedParkIds.map((id) => new Types.ObjectId(id)) };
  const vehicles = await Vehicle.find(vehicleFilter);
  const totalVehicles = vehicles.length;
  const available = vehicles.filter((v) => v.status === 'available').length;
  const rented = vehicles.filter((v) => v.status === 'rented').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;

  const ongoingCount = await Rental.countDocuments({ ...rentalMatch, status: { $in: ['ongoing', 'late'] } });
  const completedCount = await Rental.countDocuments({ ...rentalMatch, status: 'completed' });
  const totalRentals = revenueAgg?.count || 0;
  const totalDaysRented = revenueAgg?.days || 0;

  let utilizationRate = 0;
  if (totalVehicles > 0 && (filters.from || filters.to)) {
    const periodDays = filters.from && filters.to
      ? Math.max(1, Math.ceil((filters.to.getTime() - filters.from.getTime()) / (1000 * 60 * 60 * 24)))
      : 30;
    utilizationRate = Math.min(100, (totalDaysRented / (totalVehicles * periodDays)) * 100);
  } else if (totalVehicles > 0) {
    utilizationRate = (rented / totalVehicles) * 100;
  }

  const maintenanceDocs = await Maintenance.find({ vehicle: { $in: vehicles.map((vehicle) => vehicle._id) } });
  const upToDate = maintenanceDocs.filter((m) => m.status === 'upcoming').length;
  const maintenanceReadiness = totalVehicles > 0 ? (upToDate / Math.max(1, maintenanceDocs.length)) * 100 : 0;

  return {
    revenue,
    paidAmount: revenueAgg?.paid || 0,
    outstandingAmount: revenue - (revenueAgg?.paid || 0),
    expensesTotal,
    netProfit,
    margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    totalVehicles,
    availableVehicles: available,
    rentedVehicles: rented,
    maintenanceVehicles: maintenance,
    totalRentals,
    ongoingRentals: ongoingCount,
    completedRentals: completedCount,
    totalDaysRented,
    utilizationRate,
    maintenanceReadiness,
    averageRevenuePerRental: totalRentals > 0 ? revenue / totalRentals : 0,
  };
}

export async function getVehiclePerformance(filters: DashboardFilters) {
  const rentalMatch = buildRentalMatch(filters);
  const perf = await Rental.aggregate([
    { $match: { ...rentalMatch, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$vehicle',
        rentalsCount: { $sum: 1 },
        daysRented: { $sum: '$days' },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
    { $unwind: '$vehicle' },
  ]);

  const expenseMatch = buildExpenseMatch(filters);
  const expensesByVehicle = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: '$vehicle', total: { $sum: '$amount' } } },
  ]);
  const expenseMap = new Map(expensesByVehicle.map((e) => [String(e._id), e.total]));

  return perf
    .map((p) => {
      const expenses = expenseMap.get(String(p._id)) || 0;
      const profit = p.revenue - expenses;
      return {
        vehicleId: p._id,
        vehicleName: `${p.vehicle.brand} ${p.vehicle.model}`,
        plateNumber: p.vehicle.plateNumber,
        rentalsCount: p.rentalsCount,
        daysRented: p.daysRented,
        revenue: p.revenue,
        expenses,
        profit,
        margin: p.revenue > 0 ? (profit / p.revenue) * 100 : 0,
      };
    })
    .sort((a, b) => b.profit - a.profit);
}

export async function getExpenseBreakdown(filters: DashboardFilters) {
  const expenseMatch = buildExpenseMatch(filters);
  const breakdown = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
  return breakdown.map((b) => ({ category: b._id, total: b.total }));
}

export async function getRevenueTrend(filters: DashboardFilters, granularity: 'day' | 'week' | 'month' = 'day') {
  const rentalMatch = buildRentalMatch(filters);
  const dateFormat = granularity === 'month' ? '%Y-%m' : granularity === 'week' ? '%Y-W%V' : '%Y-%m-%d';

  const revenueTrend = await Rental.aggregate([
    { $match: { ...rentalMatch, status: { $ne: 'cancelled' } } },
    { $group: { _id: { $dateToString: { format: dateFormat, date: '$startDate' } }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);

  const expenseMatch = buildExpenseMatch(filters);
  const expenseTrend = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, expenses: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);

  const map = new Map<string, { period: string; revenue: number; expenses: number }>();
  for (const r of revenueTrend) map.set(r._id, { period: r._id, revenue: r.revenue, expenses: 0 });
  for (const e of expenseTrend) {
    const existing = map.get(e._id);
    if (existing) existing.expenses = e.expenses;
    else map.set(e._id, { period: e._id, revenue: 0, expenses: e.expenses });
  }
  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
}
