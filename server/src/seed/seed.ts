import bcrypt from 'bcryptjs';
import {
  User, Park, Vehicle, Zone, VehicleRate, Client, Rental, Payment,
  Expense, MaintenanceType, Maintenance, CompanySettings,
} from '../models';
import { computeDays, computeRentalAmount } from '../services/rentalService';
import { generateRentalNumber } from '../utils/generateNumber';
import { computeMaintenanceStatus } from '../services/maintenanceService';
import { env } from '../config/env';

export async function runSeed() {
  if (env.nodeEnv !== 'development') {
    throw new Error('Demo seeding is only allowed in development because it clears the database.');
  }

  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Park.deleteMany({}), Vehicle.deleteMany({}), Zone.deleteMany({}),
    VehicleRate.deleteMany({}), Client.deleteMany({}), Rental.deleteMany({}), Payment.deleteMany({}),
    Expense.deleteMany({}), MaintenanceType.deleteMany({}), Maintenance.deleteMany({}), CompanySettings.deleteMany({}),
  ]);

  console.log('[seed] Creating company settings...');
  await CompanySettings.create({
    name: 'Horizon360',
    currency: 'FCFA',
    minRentalDays: 1,
    defaultDeposit: 50000,
    lateFeePerDay: 10000,
  });

  console.log('[seed] Creating users...');
  const superAdminHash = await bcrypt.hash('SuperAdmin123!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);
  const userHash = await bcrypt.hash('User123!', 10);

  const superAdmin = await User.create({
    firstName: 'Alioune', lastName: 'Diop', username: 'superadmin', email: 'superadmin@horizon360.sn',
    passwordHash: superAdminHash, role: 'superadmin', status: 'active', mustChangePassword: false,
  });
  const admin = await User.create({
    firstName: 'Fatou', lastName: 'Ndiaye', username: 'admin', email: 'admin@horizon360.sn',
    passwordHash: adminHash, role: 'admin', status: 'active', mustChangePassword: false, createdBy: superAdmin._id,
  });
  await User.create({
    firstName: 'Moussa', lastName: 'Fall', username: 'user', email: 'user@horizon360.sn',
    passwordHash: userHash, role: 'user', status: 'active', mustChangePassword: false, createdBy: admin._id,
  });

  console.log('[seed] Creating parks...');
  const parkDakar = await Park.create({
    name: 'Parc Dakar', description: 'Parc principal basé à Dakar', location: 'Dakar, Sénégal',
    manager: 'Fatou Ndiaye', phone: '+221 77 000 00 00', email: 'dakar@horizon360.sn', status: 'active',
  });
  const parkThies = await Park.create({
    name: 'Parc Thiès', description: 'Parc secondaire basé à Thiès', location: 'Thiès, Sénégal',
    manager: 'Moussa Fall', phone: '+221 77 111 11 11', email: 'thies@horizon360.sn', status: 'active',
  });

  console.log('[seed] Creating zones...');
  const zoneDakar = await Zone.create({ name: 'Dakar', description: 'Location dans Dakar', defaultPricePerDay: 30000 });
  const zoneHorsDakar = await Zone.create({ name: 'Hors Dakar', description: 'Location en dehors de Dakar', defaultPricePerDay: 35000 });

  console.log('[seed] Creating vehicles...');
  const vGrandeur = await Vehicle.create({
    park: parkDakar._id, brand: 'Hyundai', model: 'Grandeur', year: 2022, plateNumber: 'DK-1234-AB',
    color: 'Noir', fuelType: 'Essence', transmission: 'Automatique', seats: 5, mileage: 45000,
    mileageAtPurchase: 0, acquisitionDate: new Date('2022-01-15'), acquisitionPrice: 15000000,
    status: 'available', insuranceExpiryDate: new Date('2026-09-15'), technicalControlExpiryDate: new Date('2026-08-25'),
  });
  const vSonata = await Vehicle.create({
    park: parkDakar._id, brand: 'Hyundai', model: 'Sonata', year: 2021, plateNumber: 'DK-5678-CD',
    color: 'Blanc', fuelType: 'Essence', transmission: 'Automatique', seats: 5, mileage: 62000,
    acquisitionDate: new Date('2021-06-10'), acquisitionPrice: 13000000,
    status: 'available', insuranceExpiryDate: new Date('2026-08-20'), technicalControlExpiryDate: new Date('2027-01-10'),
  });
  const vElantra = await Vehicle.create({
    park: parkDakar._id, brand: 'Hyundai', model: 'Elantra', year: 2023, plateNumber: 'DK-9012-EF',
    color: 'Gris', fuelType: 'Essence', transmission: 'Manuelle', seats: 5, mileage: 12000,
    acquisitionDate: new Date('2023-03-01'), acquisitionPrice: 12000000,
    status: 'maintenance', insuranceExpiryDate: new Date('2027-03-01'), technicalControlExpiryDate: new Date('2027-03-01'),
  });
  const vCorolla = await Vehicle.create({
    park: parkThies._id, brand: 'Toyota', model: 'Corolla', year: 2022, plateNumber: 'TH-3344-GH',
    color: 'Blanc', fuelType: 'Essence', transmission: 'Automatique', seats: 5, mileage: 30000,
    acquisitionDate: new Date('2022-05-20'), acquisitionPrice: 11000000,
    status: 'available', insuranceExpiryDate: new Date('2026-09-05'), technicalControlExpiryDate: new Date('2026-12-01'),
  });
  const vRav4 = await Vehicle.create({
    park: parkThies._id, brand: 'Toyota', model: 'RAV4', year: 2023, plateNumber: 'TH-5566-IJ',
    color: 'Noir', fuelType: 'Diesel', transmission: 'Automatique', seats: 5, mileage: 8000,
    acquisitionDate: new Date('2023-07-15'), acquisitionPrice: 18000000,
    status: 'available', insuranceExpiryDate: new Date('2026-08-18'), technicalControlExpiryDate: new Date('2027-07-15'),
  });

  console.log('[seed] Creating vehicle rates...');
  const rates = [
    { vehicle: vGrandeur._id, zone: zoneDakar._id, pricePerDay: 30000, deposit: 100000 },
    { vehicle: vGrandeur._id, zone: zoneHorsDakar._id, pricePerDay: 35000, deposit: 100000 },
    { vehicle: vSonata._id, zone: zoneDakar._id, pricePerDay: 27000, deposit: 80000 },
    { vehicle: vSonata._id, zone: zoneHorsDakar._id, pricePerDay: 32000, deposit: 80000 },
    { vehicle: vElantra._id, zone: zoneDakar._id, pricePerDay: 25000, deposit: 75000 },
    { vehicle: vElantra._id, zone: zoneHorsDakar._id, pricePerDay: 30000, deposit: 75000 },
    { vehicle: vCorolla._id, zone: zoneDakar._id, pricePerDay: 25000, deposit: 75000 },
    { vehicle: vCorolla._id, zone: zoneHorsDakar._id, pricePerDay: 30000, deposit: 75000 },
    { vehicle: vRav4._id, zone: zoneDakar._id, pricePerDay: 40000, deposit: 150000 },
    { vehicle: vRav4._id, zone: zoneHorsDakar._id, pricePerDay: 45000, deposit: 150000 },
  ];
  await VehicleRate.insertMany(rates);

  console.log('[seed] Creating clients...');
  const client1 = await Client.create({
    firstName: 'Ibrahima', lastName: 'Sarr', phone: '+221 77 222 33 44', email: 'ibrahima.sarr@example.com',
    address: 'Sacré-Coeur, Dakar', nationality: 'Sénégalaise', idNumber: '1234567890123',
    licenseNumber: 'PC-556677', licenseExpiryDate: new Date('2028-05-01'),
  });
  const client2 = await Client.create({
    firstName: 'Aissatou', lastName: 'Ba', phone: '+221 76 555 66 77', email: 'aissatou.ba@example.com',
    address: 'Mermoz, Dakar', nationality: 'Sénégalaise', idNumber: '9876543210987',
    licenseNumber: 'PC-889900', licenseExpiryDate: new Date('2027-11-20'),
  });
  const client3 = await Client.create({
    firstName: 'Jean', lastName: 'Dupont', phone: '+33 6 12 34 56 78', email: 'jean.dupont@example.com',
    address: 'Paris, France', nationality: 'Française', idNumber: 'FR998877665',
    licenseNumber: 'FR-112233', licenseExpiryDate: new Date('2029-01-10'),
  });

  console.log('[seed] Creating rentals...');
  async function makeRental(client: any, vehicle: any, zone: any, ratePerDay: number, startOffsetDays: number, days: number, status: string, paidRatio = 1) {
    const start = new Date();
    start.setDate(start.getDate() + startOffsetDays);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const { grossAmount, totalAmount } = computeRentalAmount({ days, ratePerDay });
    const paidAmount = Math.round(totalAmount * paidRatio);

    const rental = await Rental.create({
      rentalNumber: generateRentalNumber(),
      client: client._id, vehicle: vehicle._id, park: vehicle.park, zone: zone._id,
      startDate: start, endDate: end, days, ratePerDay, grossAmount, discount: 0, extraFees: 0,
      deposit: Math.round(ratePerDay * 2), totalAmount, paidAmount, balanceDue: totalAmount - paidAmount,
      paymentMethod: 'Espèces', status, observations: `Location ${days} jours`,
      mileageStart: status === 'completed' || status === 'ongoing' ? vehicle.mileage : undefined,
      mileageEnd: status === 'completed' ? vehicle.mileage + days * 80 : undefined,
      kmDriven: status === 'completed' ? days * 80 : undefined,
    });
    if (paidAmount > 0) {
      await Payment.create({ rental: rental._id, amount: paidAmount, method: 'Espèces', date: start });
    }
    return rental;
  }

  await makeRental(client1, vGrandeur, zoneDakar, 30000, -30, 2, 'completed', 1);
  await makeRental(client2, vGrandeur, zoneDakar, 30000, -18, 2, 'completed', 1);
  await makeRental(client3, vSonata, zoneDakar, 27000, -18, 2, 'completed', 1);
  await makeRental(client1, vGrandeur, zoneHorsDakar, 35000, -40, 2, 'completed', 1);
  await makeRental(client2, vCorolla, zoneDakar, 25000, -10, 3, 'completed', 0.6);
  await makeRental(client3, vRav4, zoneHorsDakar, 45000, -2, 4, 'ongoing', 0.5);
  await makeRental(client1, vSonata, zoneDakar, 27000, 3, 3, 'confirmed', 0.3);
  await makeRental(client2, vRav4, zoneDakar, 40000, 10, 2, 'reservation', 0);

  vGrandeur.status = 'available';
  vSonata.status = 'available';
  vRav4.status = 'rented';
  await Promise.all([vGrandeur.save(), vSonata.save(), vRav4.save()]);

  console.log('[seed] Creating expenses...');
  const expenseCategories: [any, string, number, string][] = [
    [vGrandeur, 'Pneumatiques', 60000, 'Changement de pneus et réparation de jantes'],
    [vGrandeur, 'Carburant', 25000, 'Plein de carburant'],
    [vSonata, 'Vidange', 35000, 'Vidange + filtre à huile'],
    [vElantra, 'Réparation', 120000, 'Réparation moteur — véhicule actuellement en maintenance'],
    [vCorolla, 'Assurance', 180000, 'Renouvellement assurance annuelle'],
    [vRav4, 'Lavage', 5000, 'Lavage complet'],
    [vGrandeur, 'Contrôle technique', 15000, 'Contrôle technique annuel'],
    [vSonata, 'Péage', 3000, 'Péage autoroute'],
  ];
  for (let i = 0; i < expenseCategories.length; i++) {
    const [vehicle, category, amount, description] = expenseCategories[i];
    const date = new Date();
    date.setDate(date.getDate() - (i * 4 + 2));
    await Expense.create({
      date, vehicle: vehicle._id, park: vehicle.park, category, description, amount,
      paymentMethod: 'Espèces', mileage: vehicle.mileage, supplier: 'Garage Central',
    });
  }

  console.log('[seed] Creating maintenance types & schedules...');
  const vidange = await MaintenanceType.create({ name: 'Vidange', mileageInterval: 5000, timeIntervalMonths: 3, description: 'Vidange moteur' });
  const pneus = await MaintenanceType.create({ name: 'Pneus', mileageInterval: 40000, description: 'Changement de pneus' });
  const controleTechnique = await MaintenanceType.create({ name: 'Contrôle technique', timeIntervalMonths: 12, description: 'Contrôle technique réglementaire' });
  const assurance = await MaintenanceType.create({ name: 'Assurance', timeIntervalMonths: 12, description: "Renouvellement d'assurance" });

  async function makeMaintenance(vehicle: any, type: any, lastMileage: number, lastDate: Date) {
    let nextDueDate: Date | undefined;
    let nextDueMileage: number | undefined;
    if (type.timeIntervalMonths) {
      nextDueDate = new Date(lastDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + type.timeIntervalMonths);
    }
    if (type.mileageInterval) nextDueMileage = lastMileage + type.mileageInterval;
    const status = computeMaintenanceStatus(vehicle.mileage, nextDueMileage, nextDueDate);
    await Maintenance.create({ vehicle: vehicle._id, type: type._id, lastServiceDate: lastDate, lastServiceMileage: lastMileage, nextDueDate, nextDueMileage, status });
  }

  await makeMaintenance(vGrandeur, vidange, 40000, new Date(Date.now() - 75 * 24 * 60 * 60 * 1000));
  await makeMaintenance(vSonata, vidange, 58000, new Date(Date.now() - 20 * 24 * 60 * 60 * 1000));
  await makeMaintenance(vRav4, pneus, 0, new Date(Date.now() - 100 * 24 * 60 * 60 * 1000));
  await makeMaintenance(vGrandeur, controleTechnique, 0, new Date('2025-08-25'));
  await makeMaintenance(vCorolla, assurance, 0, new Date('2025-09-05'));

  console.log('\n[seed] Done! Demo accounts:');
  console.log('  SuperAdmin -> username: superadmin / password: SuperAdmin123!');
  console.log('  Admin      -> username: admin      / password: Admin123!');
  console.log('  User       -> username: user        / password: User123!');
}

if (require.main === module) {
  import('../config/db').then(async ({ connectDB, disconnectDB }) => {
    await connectDB();
    await runSeed();
    await disconnectDB();
    process.exit(0);
  }).catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}
