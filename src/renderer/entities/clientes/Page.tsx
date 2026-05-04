import CrudPage from '../../pages/CrudPage';
import SecondaryButton from '../../components/SecondaryButton';
import { useModal } from '../../providers/ModalProvider';
import config from './config';
import ClientPurchases from './ClientPurchases';
import type { Cliente } from '../../hooks/useClients';

export default function PageClientes() {
  const { openModal } = useModal();

  return (
    <CrudPage<Cliente>
      config={config}
      renderSelectedActions={({ selectedItem }) => (
        <div className="w-full sm:w-auto" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
          <SecondaryButton
            className="w-full"
            title="Ver compras"
            functionClick={() => openModal(<ClientPurchases cliente={selectedItem} />)}
          />
        </div>
      )}
    />
  );
}
