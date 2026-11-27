export type UserRole = 'superadmin' | 'admin' | 'user';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  mustChangePassword: boolean;
  createdAt: string;
}

export interface Park {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  manager?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  vehicleCount?: number;
  revenue?: number;
  expenses?: number;
  netProfit?: number;
  utilizationRate?: number;
  assignedUsers?: User[] | string[];
}

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'unavailable' | 'archived';

export interface Vehicle {
  _id: string;
  park: Park | string;
  brand: string;
  model: string;
  year?: number;
  plateNumber: string;
  vin?: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  mileage: number;
  acquisitionDate?: string;
  acquisitionPrice?: number;
  status: VehicleStatus;
  insuranceExpiryDate?: string;
  technicalControlExpiryDate?: string;
  notes?: string;
  photoUrl?: string;
  gallery: string[];
  displayName?: string;
}

export interface Zone {
  _id: string;
  name: string;
  description?: string;
  defaultPricePerDay?: number;
  status: 'active' | 'inactive';
}

export interface VehicleRate {
  _id: string;
  vehicle: Vehicle | string;
  zone: Zone | string;
  pricePerDay: number;
  deposit?: number;
  status: 'active' | 'inactive';
}

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
  idNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  rentalsCount?: number;
  totalSpent?: number;
}

export type RentalStatus = 'reservation' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'late';

export interface Rental {
  _id: string;
  rentalNumber: string;
  client: Client | string;
  vehicle: Vehicle | string;
  park: Park | string;
  zone: Zone | string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
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
}

export interface Expense {
  _id: string;
  date: string;
  vehicle?: Vehicle | string;
  park?: Park | string;
  category: string;
  description?: string;
  amount: number;
  paymentMethod?: string;
  mileage?: number;
  supplier?: string;
  receiptUrl?: string;
  observation?: string;
}

export interface MaintenanceType {
  _id: string;
  name: string;
  mileageInterval?: number;
  timeIntervalMonths?: number;
  description?: string;
}

export type MaintenanceStatus = 'upcoming' | 'due_soon' | 'due' | 'overdue' | 'done';

export interface Maintenance {
  _id: string;
  vehicle: Vehicle | string;
  type: MaintenanceType | string;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  nextDueDate?: string;
  nextDueMileage?: number;
  status: MaintenanceStatus;
  cost?: number;
  notes?: string;
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  relatedVehicle?: Vehicle | string;
  read: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  revenue: number;
  paidAmount: number;
  outstandingAmount: number;
  expensesTotal: number;
  netProfit: number;
  margin: number;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  totalRentals: number;
  ongoingRentals: number;
  completedRentals: number;
  totalDaysRented: number;
  utilizationRate: number;
  maintenanceReadiness: number;
  averageRevenuePerRental: number;
}

export interface CompanySettings {
  _id: string;
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
