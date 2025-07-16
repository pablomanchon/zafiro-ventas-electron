import { useState, useEffect, useCallback } from 'react';
import { getAll, create, update, remove } from '../api/crud';

export default function useCrud<T>(entity: string) {
  const [items, setItems] = useState<T[]>([]);

  const fetchItems = useCallback(async () => {
    const data = await getAll<T>(entity);
    setItems(data);
  }, [entity]);

  const addItem = async (payload: T) => {
    await create<T>(entity, payload);
    fetchItems();
  };

  const updateItem = async (id: number, payload: Partial<T>) => {
    await update<T>(entity, id, payload);
    fetchItems();
  };

  const deleteItem = async (id: number) => {
    await remove<T>(entity, id);
    fetchItems();
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, fetchItems, addItem, updateItem, deleteItem };
}
