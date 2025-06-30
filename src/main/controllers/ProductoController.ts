import { Request, Response } from "express";
import { ProductoService } from "../services/ProductoService";

export class ProductoController {
  static async obtenerProductos(req: Request, res: Response): Promise<Response> {
    try {
      const productos = await ProductoService.obtenerTodos();
      return res.json(productos);
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
  }

  static async crearProducto(req: Request, res: Response): Promise<Response> {
    try {
      const producto = await ProductoService.crearProducto(req.body);
      return res.status(201).json(producto);
    } catch (error) {
      return res.status(500).json({ error: 'Error al crear producto' });
    }
  }

  static async actualizarProducto(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    try {
      const producto = await ProductoService.actualizarProducto(parseInt(id), req.body);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.json(producto);
    } catch (error) {
      return res.status(500).json({ error: 'Error al actualizar producto' });
    }
  }

  static async eliminarProducto(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    try {
      const producto = await ProductoService.eliminarProducto(parseInt(id));
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Error al eliminar producto' });
    }
  }
}
