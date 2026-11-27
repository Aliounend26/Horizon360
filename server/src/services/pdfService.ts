import PDFDocument from 'pdfkit';
import { IRental } from '../models/Rental';
import { ICompanySettings } from '../models/CompanySettings';

export function buildRentalInvoicePDF(
  rental: any,
  company: Partial<ICompanySettings>
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  doc.fillColor('#1E3A8A').fontSize(22).font('Helvetica-Bold').text(company.name || 'Horizon360', 50, 50);
  doc.fillColor('#555').fontSize(10).font('Helvetica').text('Plateforme de gestion de location de véhicules', 50, 78);
  if (company.address) doc.text(company.address, 50, 92);
  if (company.phone) doc.text(`Tél: ${company.phone}`, 50, 104);

  doc.fillColor('#111').fontSize(16).font('Helvetica-Bold').text(`Reçu de location — ${rental.rentalNumber}`, 50, 140);
  doc.moveTo(50, 165).lineTo(545, 165).strokeColor('#1E3A8A').lineWidth(1.5).stroke();

  const client = rental.client;
  const vehicle = rental.vehicle;
  const zone = rental.zone;

  let y = 180;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#111').text('Client', 50, y);
  doc.font('Helvetica').fillColor('#333');
  y += 16;
  doc.text(`${client.firstName} ${client.lastName}`, 50, y);
  y += 14;
  doc.text(`Téléphone: ${client.phone}`, 50, y);

  y = 180;
  doc.font('Helvetica-Bold').fillColor('#111').text('Véhicule', 320, y);
  doc.font('Helvetica').fillColor('#333');
  y += 16;
  doc.text(`${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})`, 320, y);
  y += 14;
  doc.text(`Zone: ${zone.name}`, 320, y);

  y = 250;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#ddd').lineWidth(1).stroke();
  y += 15;

  const rows: [string, string][] = [
    ['Date de départ', new Date(rental.startDate).toLocaleDateString('fr-FR')],
    ['Date de retour', new Date(rental.endDate).toLocaleDateString('fr-FR')],
    ['Nombre de jours', String(rental.days)],
    ['Tarif journalier', `${rental.ratePerDay.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`],
    ['Montant brut', `${rental.grossAmount.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`],
    ['Réduction', `${rental.discount.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`],
    ['Frais supplémentaires', `${rental.extraFees.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`],
    ['Caution', `${rental.deposit.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`],
  ];

  doc.font('Helvetica');
  for (const [label, value] of rows) {
    doc.fillColor('#555').text(label, 50, y);
    doc.fillColor('#111').text(value, 350, y, { width: 195, align: 'right' });
    y += 20;
  }

  y += 10;
  doc.rect(50, y, 495, 60).fill('#F1F5F9');
  doc.fillColor('#1E3A8A').fontSize(13).font('Helvetica-Bold').text('TOTAL', 65, y + 12);
  doc.text(`${rental.totalAmount.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`, 350, y + 12, { width: 180, align: 'right' });
  doc.fontSize(10).fillColor('#333').font('Helvetica').text(`Payé: ${rental.paidAmount.toLocaleString('fr-FR')} — Reste: ${rental.balanceDue.toLocaleString('fr-FR')} ${company.currency || 'FCFA'}`, 65, y + 36);

  y += 90;
  doc.fontSize(9).fillColor('#888').font('Helvetica').text('Conditions: le véhicule doit être restitué avec le même niveau de carburant. Toute dégradation sera facturée sur la caution.', 50, y, { width: 495 });

  y += 60;
  doc.fillColor('#333').text('Signature client', 50, y);
  doc.text('Signature Horizon360', 350, y);
  doc.moveTo(50, y - 10).lineTo(200, y - 10).strokeColor('#aaa').stroke();
  doc.moveTo(350, y - 10).lineTo(500, y - 10).strokeColor('#aaa').stroke();

  return doc;
}
