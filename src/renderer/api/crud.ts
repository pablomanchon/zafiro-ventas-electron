import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

export async function getAll<T>(entity: string): Promise<T[]> {
  const { data } = await axios.get<T[]>(`${BASE_URL}/${entity}`);
  return data;
}

export async function create<T>(entity: string, payload: T): Promise<T> {
  const { data } = await axios.post<T>(`${BASE_URL}/${entity}`, payload);
  return data;
}

export async function update<T>(
  entity: string,
  id: number,
  payload: Partial<T>,
): Promise<T> {
  const { data } = await axios.patch<T>(`${BASE_URL}/${entity}/${id}`, payload);
  return data;
}

export async function remove<T>(entity: string, id: number): Promise<T> {
  const { data } = await axios.delete<T>(`${BASE_URL}/${entity}/${id}`);
  return data;
}
