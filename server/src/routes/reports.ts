import { Router } from 'express';
import { asyncHandler, ApiError } from '../utils/asyncHandler';
import { requireAuth, requireParkAccess, requireRole, AuthRequest } from '../middlewares/auth';
import { buildFinancialReportWorkbook } from '../services/excelService';
import { buildRentalInvoicePDF } from '../services/pdfService';
import { Rental, CompanySettings } from '../models';
import { DashboardFilters } from '../services/dashboardService';

const router = Router();
router.use(requireAuth);

function parseFilters(req: any): DashboardFilters {
  return {
    from: req.query.from ? new Date(String(req.query.from)) : undefined,
    to: req.query.to ? new Date(String(req.query.to)) : undefined,
    park: req.query.park ? String(req.query.park) : undefined,
    vehicle: req.query.vehicle ? String(req.query.vehicle) : undefined,
    zone: req.query.zone ? String(req.query.zone) : undefined,
  };
}

router.get('/financial/excel', requireRole('superadmin', 'admin'), asyncHandler(async (req, res) => {
  const workbook = await buildFinancialReportWorkbook(parseFilters(req));
  const filename = `Rapport_Financier_Horizon360_${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}));

router.get('/rentals/:id/invoice', asyncHandler(async (req: AuthRequest, res) => {
  const rental = await Rental.findById(req.params.id).populate('client').populate('vehicle').populate('zone');
  if (!rental) throw new ApiError(404, 'Location introuvable');
  try { await requireParkAccess(req, rental.park); } catch { throw new ApiError(403, 'Accès refusé à cette location'); }
  let company = await CompanySettings.findOne();
  if (!company) company = await CompanySettings.create({});

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Recu_${rental.rentalNumber}.pdf"`);
  const doc = buildRentalInvoicePDF(rental.toJSON(), company.toJSON() as any);
  doc.pipe(res);
  doc.end();
}));

export default router;
