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
        <div className="flex-1 min-w-0 sm:flex-none sm:w-auto" tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
          <SecondaryButton
            className="w-full whitespace-nowrap !p-1.5 text-xs sm:!p-2 sm:text-base"
            title="Ver compras"
            functionClick={() => openModal(<ClientPurchases cliente={selectedItem} />)}
          />
        </div>
      )}
    />
  );
}
