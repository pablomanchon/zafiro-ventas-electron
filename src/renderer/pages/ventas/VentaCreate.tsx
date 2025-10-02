import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { AnyAction } from '@reduxjs/toolkit';

interface VentaInitPayload {
  idVenta?: string;
  [key: string]: unknown;
}

const fetchVentaById = (idVenta: string): AnyAction => ({
  type: 'ventas/fetchVentaById',
  payload: idVenta,
});

export function VentaCreate() {
  const { idVenta: idVentaFromRoute } = useParams<{ idVenta?: string }>();
  const dispatch = useDispatch<(action: AnyAction) => unknown>();
  const [initData, setInitData] = useState<VentaInitPayload | null>(null);

  useEffect(() => {
    const cleanupIpc = window.electronAPI?.onInitData<VentaInitPayload>((payload) => {
      setInitData(payload);
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.opener || event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'INIT_DATA') {
        setInitData(event.data.payload as VentaInitPayload);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    if (window.opener) {
      window.opener.postMessage({ type: 'READY' }, window.location.origin);
    }

    return () => {
      cleanupIpc?.();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const idFromPayload = initData?.idVenta ?? null;

  const effectiveIdVenta = useMemo(() => {
    return idFromPayload ?? idVentaFromRoute ?? null;
  }, [idFromPayload, idVentaFromRoute]);

  useEffect(() => {
    if (!initData && idVentaFromRoute) {
      dispatch(fetchVentaById(idVentaFromRoute));
    }
  }, [dispatch, idVentaFromRoute, initData]);

  return (
    <section>
      <h2>Venta</h2>
      {initData ? (
        <pre>{JSON.stringify(initData, null, 2)}</pre>
      ) : (
        <p>No se recibió payload inicial. Usando idVenta de la ruta: {effectiveIdVenta ?? 'N/A'}</p>
      )}
    </section>
  );
}
