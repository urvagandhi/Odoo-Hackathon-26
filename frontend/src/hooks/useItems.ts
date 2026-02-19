/**
 * Custom hooks for Items CRUD operations.
 */
import { useCallback, useEffect, useState } from "react";
import { itemsApi, type ItemPayload, type ItemResponse } from "../api/client";

export function useItems() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await itemsApi.getAll();
      setItems(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch items";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (payload: ItemPayload) => {
    const { data } = await itemsApi.create(payload);
    setItems((prev) => [data, ...prev]);
    return data;
  };

  const deleteItem = async (id: number) => {
    await itemsApi.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = async (id: number, payload: Partial<ItemPayload>) => {
    const { data } = await itemsApi.update(id, payload);
    setItems((prev) => prev.map((item) => (item.id === id ? data : item)));
    return data;
  };

  return { items, loading, error, fetchItems, createItem, deleteItem, updateItem };
}
