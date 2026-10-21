import { Router } from "express";
import { ah } from "../utils/async.js";

export function estadisticasRoutes({ estadisticas: e }) {
  const r = Router();
  r.get("/resumen", ah(async (req, res) => res.json(await e.resumen(req.usuarioId, req.query))));
  r.get("/ventas-por-dia", ah(async (req, res) => res.json(await e.ventasPorDia(req.usuarioId, req.query))));
  r.get("/ventas-por-periodo", ah(async (req, res) => res.json(await e.ventasPorPeriodo(req.usuarioId, req.query))));
  r.get("/productos-mas-vendidos", ah(async (req, res) => res.json(await e.productosTop(req.usuarioId, req.query))));
  r.get("/productos-menos-vendidos", ah(async (req, res) => res.json(await e.productosMenosVendidos(req.usuarioId, req.query))));
  r.get("/stock-bajo", ah(async (req, res) => res.json(await e.stockBajo(req.usuarioId))));
  r.get("/valor-inventario", ah(async (req, res) => res.json(await e.valorInventario(req.usuarioId))));
  return r;
}
