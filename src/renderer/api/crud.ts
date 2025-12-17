
// src/api/crud.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

export async function getAll<T = any>(
  entity: string,
  params?: Record<string, any>
): Promise<T[]> {
  try {

    const { data } = await axios.get<T[]>(`${BASE_URL}/${entity}`, {
      params,
    });
    return data;
  } catch (error) {
    throw (error as any).response.data.message
  }
}

export async function create<T = any>(entity: string, payload: any): Promise<T> {
  try {
    const { data } = await axios.post<T>(`${BASE_URL}/${entity}`, payload);
    return data;
  } catch (error) {
    console.log(error)
    throw (error as any).response.data.message
  }
}

export async function update<T = any>(entity: string, id: number | string, payload: any): Promise<T> {
  const { data } = await axios.patch<T>(`${BASE_URL}/${entity}/${id}`, payload);
  return data;
}
export async function getById<T = any>(entity: string, id: number | string): Promise<T> {
  const { data } = await axios.get<T>(`${BASE_URL}/${entity}/${id}`);
  return data;
}

export async function remove<T = any>(entity: string, id: number | string): Promise<T> {
  const { data } = await axios.delete<T>(`${BASE_URL}/${entity}/${id}`);
  return data;
}
