import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

export async function getAll(entity: string) {
  const { data } = await axios.get(`${BASE_URL}/${entity}`);
  return data;
}

export async function create(entity: string, payload: any) {
  const { data } = await axios.post(`${BASE_URL}/${entity}`, payload);
  return data;
}

export async function update(entity: string, id: number, payload: any) {
  const { data } = await axios.patch(`${BASE_URL}/${entity}/${id}`, payload);
  return data;
}

export async function remove(entity: string, id: number) {
  const { data } = await axios.delete(`${BASE_URL}/${entity}/${id}`);
  return data;
}
