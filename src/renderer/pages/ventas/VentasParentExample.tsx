import { useCallback } from 'react';

type VentaInitPayload = {
  idVenta?: string;
  [key: string]: unknown;
};

function buildRoute(idVenta?: string | null) {
  return idVenta ? `/ventas/${idVenta}` : '/ventas/create';
}

function openVentaWindow(route: string, payload: VentaInitPayload) {
  if (window.electronAPI) {
    window.electronAPI.openChild(route, payload);
    return;
  }

  const childUrl = `${window.location.origin}/#${route}`;
  const child = window.open(childUrl, '_blank', 'width=1000,height=700');

  if (!child) {
    return;
  }

  const handleReady = (event: MessageEvent) => {
    if (event.source !== child || event.origin !== window.location.origin) {
      return;
    }

    if (event.data?.type === 'READY') {
      child.postMessage(
        {
          type: 'INIT_DATA',
          payload,
        },
        window.location.origin,
      );
      window.removeEventListener('message', handleReady);
    }
  };

  window.addEventListener('message', handleReady);
}

export function useOpenVenta() {
  return useCallback((idVenta?: string | null, payload: VentaInitPayload = {}) => {
    const route = buildRoute(idVenta ?? undefined);
    const initialPayload = {
      ...payload,
      ...(idVenta ? { idVenta } : {}),
    } satisfies VentaInitPayload;

    openVentaWindow(route, initialPayload);
  }, []);
}

export function VentasParentExample() {
  const openVenta = useOpenVenta();

  return (
    <div>
      <h1>Ventas</h1>
      <button type="button" onClick={() => openVenta(null, { modo: 'create' })}>
        Nueva venta
      </button>
      <button type="button" onClick={() => openVenta('123', { origen: 'listado' })}>
        Editar venta #123
      </button>
    </div>
  );
}
