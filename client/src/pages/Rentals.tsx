import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, apiErrorMessage } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Table, THead, TBody, Tr, Th, Td, EmptyState } from '../components/ui/Table';
import { RentalStatusBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/format';
import { Rental } from '../types';
import NewRentalModal from '../components/rentals/NewRentalModal';

export default function Rentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/rentals', { params: status ? { status } : {} });
      setRentals(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Gestion des locations de véhicules"
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Nouvelle location</Button>}
      />

      <div className="mb-4">
        <Select className="w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="reservation">Réservation</option>
          <option value="confirmed">Confirmée</option>
          <option value="ongoing">En cours</option>
          <option value="completed">Terminée</option>
          <option value="late">En retard</option>
          <option value="cancelled">Annulée</option>
        </Select>
      </div>

      <Table>
        <THead>
          <Tr><Th>N°</Th><Th>Client</Th><Th>Véhicule</Th><Th>Départ</Th><Th>Retour</Th><Th>Total</Th><Th>Reste</Th><Th>Statut</Th></Tr>
        </THead>
        <TBody>
          {rentals.map((r: any) => (
            <Tr key={r._id}>
              <Td><Link to={`/locations/${r._id}`} className="font-medium text-brand-700 hover:underline">{r.rentalNumber}</Link></Td>
              <Td>{r.client?.firstName} {r.client?.lastName}</Td>
              <Td>{r.vehicle?.brand} {r.vehicle?.model}</Td>
              <Td>{formatDate(r.startDate)}</Td>
              <Td>{formatDate(r.endDate)}</Td>
              <Td className="font-medium">{formatCurrency(r.totalAmount)}</Td>
              <Td className={r.balanceDue > 0 ? 'text-amber-600 font-medium' : ''}>{formatCurrency(r.balanceDue)}</Td>
              <Td><RentalStatusBadge status={r.status} /></Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      {!loading && rentals.length === 0 && <EmptyState message="Aucune location trouvée" />}

      <NewRentalModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}
