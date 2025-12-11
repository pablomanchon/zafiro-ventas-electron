// src/hooks/useStockMovements.ts
import { useEffect, useState, useCallback } from "react";
import { getAll, create } from "../api/crud";
import type { StockItem } from "../entities/movimiento-stock/movimientoStockItemsTable";

export type StockMoveType = "in" | "out";

export interface StockMove {
  id: number | string;
  moveType: StockMoveType;
  createdAt?: string;
  productsMoveStock?: {
    idProduct: string | number;
    quantity: number;
    product?: { nombre?: string };
  }[];
  [key: string]: any;
}

export interface NormalizedLine {
  idProduct: string | number;
  nombre: string;
  quantity: number;
}

export function useStockMovements() {
  const [movimientos, setMovimientos] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // ------------------------------
  // 🔹 Cargar movimientos
  // ------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAll("movimiento-stock");
      setMovimientos(data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load inicial
  useEffect(() => {
    load();
  }, [load]);

  // ------------------------------
  // 🔹 Escuchar BroadcastChannel
  // ------------------------------
  useEffect(() => {
    const ch = new BroadcastChannel("movimiento-stock");
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "MOVIMIENTO_CREADO") {
        load();
      }
    };

    ch.addEventListener("message", onMsg);

    return () => {
      ch.removeEventListener("message", onMsg);
      ch.close();
    };
  }, [load]);

  // ------------------------------
  // 🔹 Buscar por ID
  // ------------------------------
  const getById = useCallback(
    (id: string | number) =>
      movimientos.find((m) => Number(m.id) === Number(id)) ?? null,
    [movimientos]
  );

  // ------------------------------
  // 🔹 Normalizar líneas de productos
  // ------------------------------
  const normalizeLines = useCallback(
    (mov: StockMove | null): NormalizedLine[] => {
      if (!mov) return [];

      const origen =
        mov.productsMoveStock ??
        mov.products ??
        mov.items ??
        [];

      return origen.map((p: any) => {
        const idProduct =
          p.idProduct ?? p.productId ?? p.product?.id;
        const quantity = p.quantity ?? p.cantidad ?? 0;
        const nombre =
          p.nombre ??
          p.product?.nombre ??
          String(idProduct) ??
          "";

        return { idProduct, nombre, quantity };
      });
    },
    []
  );

  // ------------------------------
  // 🔹 Crear movimiento de stock
  // ------------------------------
  const createMove = useCallback(
    async (moveType: StockMoveType, items: StockItem[]) => {
      const productosValidos = items
        .filter((it) => it.productId && Number(it.cantidad) > 0)
        .map((it) => ({
          idProduct: it.productId,
          quantity: Number(it.cantidad),
        }));

      const result = await create("movimiento-stock", {
        moveType,
        products: productosValidos,
      });

      // Notificar al listado
      try {
        const ch = new BroadcastChannel("movimiento-stock");
        ch.postMessage({ type: "MOVIMIENTO_CREADO", movimientoId: result.id });
        ch.close();
      } catch {}

      return result;
    },
    []
  );

  return {
    movimientos,
    loading,
    error,
    reload: load,
    getById,
    normalizeLines,
    createMove,
  };
}
