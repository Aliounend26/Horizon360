import ExcelJS from 'exceljs';
import { Rental, Expense, Vehicle } from '../models';
import { getDashboardSummary, getVehiclePerformance, DashboardFilters } from './dashboardService';

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true };

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}

export async function buildFinancialReportWorkbook(filters: DashboardFilters): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Horizon360';
  wb.created = new Date();

  const summary = await getDashboardSummary(filters);
  const summarySheet = wb.addWorksheet('Résumé');
  summarySheet.columns = [{ width: 32 }, { width: 22 }];
  summarySheet.addRow(['Rapport financier Horizon360', '']);
  summarySheet.addRow(['Généré le', new Date().toLocaleString('fr-FR')]);
  summarySheet.addRow([]);
  const rows: [string, string | number][] = [
    ["Chiffre d'affaires", summary.revenue],
    ['Montant encaissé', summary.paidAmount],
    ['Reste à payer', summary.outstandingAmount],
    ['Dépenses totales', summary.expensesTotal],
    ['Bénéfice net', summary.netProfit],
    ['Marge (%)', Number(summary.margin.toFixed(2))],
    ['Total véhicules', summary.totalVehicles],
    ['Véhicules disponibles', summary.availableVehicles],
    ['Véhicules loués', summary.rentedVehicles],
    ['Véhicules en maintenance', summary.maintenanceVehicles],
    ['Total locations', summary.totalRentals],
    ['Locations en cours', summary.ongoingRentals],
    ['Locations terminées', summary.completedRentals],
    ["Taux d'utilisation (%)", Number(summary.utilizationRate.toFixed(2))],
  ];
  rows.forEach((r) => summarySheet.addRow(r));
  summarySheet.getRow(1).font = { bold: true, size: 14 };

  const rentalMatch: any = { status: { $ne: 'cancelled' } };
  if (filters.from || filters.to) {
    rentalMatch.startDate = {};
    if (filters.from) rentalMatch.startDate.$gte = filters.from;
    if (filters.to) rentalMatch.startDate.$lte = filters.to;
  }
  if (filters.park) rentalMatch.park = filters.park;
  if (filters.vehicle) rentalMatch.vehicle = filters.vehicle;
  if (filters.zone) rentalMatch.zone = filters.zone;

  const rentals = await Rental.find(rentalMatch)
    .populate('client')
    .populate('vehicle')
    .populate('zone')
    .sort({ startDate: -1 });

  const rentalSheet = wb.addWorksheet('Locations');
  rentalSheet.columns = [
    { header: 'N°', key: 'num', width: 14 },
    { header: 'Client', key: 'client', width: 22 },
    { header: 'Téléphone', key: 'phone', width: 16 },
    { header: 'Véhicule', key: 'vehicle', width: 22 },
    { header: 'Zone', key: 'zone', width: 16 },
    { header: 'Départ', key: 'start', width: 14 },
    { header: 'Retour', key: 'end', width: 14 },
    { header: 'Jours', key: 'days', width: 10 },
    { header: 'Tarif/j', key: 'rate', width: 14 },
    { header: 'Total', key: 'total', width: 16 },
    { header: 'Payé', key: 'paid', width: 16 },
    { header: 'Reste', key: 'balance', width: 16 },
    { header: 'Statut', key: 'status', width: 16 },
  ];
  styleHeader(rentalSheet.getRow(1));
  for (const r of rentals) {
    const client = r.client as any;
    const vehicle = r.vehicle as any;
    const zone = r.zone as any;
    rentalSheet.addRow({
      num: r.rentalNumber,
      client: client ? `${client.firstName} ${client.lastName}` : '',
      phone: client?.phone || '',
      vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : '',
      zone: zone?.name || '',
      start: r.startDate.toLocaleDateString('fr-FR'),
      end: r.endDate.toLocaleDateString('fr-FR'),
      days: r.days,
      rate: r.ratePerDay,
      total: r.totalAmount,
      paid: r.paidAmount,
      balance: r.balanceDue,
      status: r.status,
    });
  }

  const expenseMatch: any = {};
  if (filters.from || filters.to) {
    expenseMatch.date = {};
    if (filters.from) expenseMatch.date.$gte = filters.from;
    if (filters.to) expenseMatch.date.$lte = filters.to;
  }
  if (filters.park) expenseMatch.park = filters.park;
  if (filters.vehicle) expenseMatch.vehicle = filters.vehicle;

  const expenses = await Expense.find(expenseMatch).populate('vehicle').sort({ date: -1 });
  const expenseSheet = wb.addWorksheet('Dépenses');
  expenseSheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Véhicule', key: 'vehicle', width: 22 },
    { header: 'Catégorie', key: 'category', width: 18 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Montant', key: 'amount', width: 16 },
    { header: 'Mode de paiement', key: 'method', width: 18 },
    { header: 'Fournisseur', key: 'supplier', width: 20 },
  ];
  styleHeader(expenseSheet.getRow(1));
  for (const e of expenses) {
    const vehicle = e.vehicle as any;
    expenseSheet.addRow({
      date: e.date.toLocaleDateString('fr-FR'),
      vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}` : '',
      category: e.category,
      description: e.description || '',
      amount: e.amount,
      method: e.paymentMethod || '',
      supplier: e.supplier || '',
    });
  }

  const vehicles = await Vehicle.find(filters.park ? { park: filters.park } : {}).populate('park');
  const vehicleSheet = wb.addWorksheet('Véhicules');
  vehicleSheet.columns = [
    { header: 'Marque', key: 'brand', width: 16 },
    { header: 'Modèle', key: 'model', width: 16 },
    { header: 'Immatriculation', key: 'plate', width: 16 },
    { header: 'Parc', key: 'park', width: 16 },
    { header: 'Statut', key: 'status', width: 14 },
    { header: 'Kilométrage', key: 'mileage', width: 14 },
  ];
  styleHeader(vehicleSheet.getRow(1));
  for (const v of vehicles) {
    vehicleSheet.addRow({
      brand: v.brand,
      model: v.model,
      plate: v.plateNumber,
      park: (v.park as any)?.name || '',
      status: v.status,
      mileage: v.mileage,
    });
  }

  const perf = await getVehiclePerformance(filters);
  const perfSheet = wb.addWorksheet('Rentabilité');
  perfSheet.columns = [
    { header: 'Véhicule', key: 'vehicle', width: 22 },
    { header: 'Locations', key: 'count', width: 12 },
    { header: 'Jours loués', key: 'days', width: 14 },
    { header: "Chiffre d'affaires", key: 'revenue', width: 18 },
    { header: 'Dépenses', key: 'expenses', width: 16 },
    { header: 'Bénéfice', key: 'profit', width: 16 },
    { header: 'Marge (%)', key: 'margin', width: 12 },
  ];
  styleHeader(perfSheet.getRow(1));
  for (const p of perf) {
    perfSheet.addRow({
      vehicle: p.vehicleName,
      count: p.rentalsCount,
      days: p.daysRented,
      revenue: p.revenue,
      expenses: p.expenses,
      profit: p.profit,
      margin: Number(p.margin.toFixed(1)),
    });
  }

  return wb;
}
