
// src/api/crud.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

export async function getAll<T = any>(entity: string): Promise<T[]> {
  const { data } = await axios.get<T[]>(`${BASE_URL}/${entity}`);
  return data;
}

export async function create<T = any>(entity: string, payload: any): Promise<T> {
  const { data } = await axios.post<T>(`${BASE_URL}/${entity}`, payload);
  return data;
}

export async function update<T = any>(entity: string, id: number, payload: any): Promise<T> {
  const { data } = await axios.patch<T>(`${BASE_URL}/${entity}/${id}`, payload);
  return data;
}

export async function remove<T = any>(entity: string, id: number): Promise<T> {
  const { data } = await axios.delete<T>(`${BASE_URL}/${entity}/${id}`);
  return data;
}
