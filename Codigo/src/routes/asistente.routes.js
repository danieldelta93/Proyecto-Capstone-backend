import { Router } from "express";
import { ah } from "../utils/async.js";

export function asistenteRoutes({ asistente }) {
  const r = Router();
  r.post("/preguntar", ah(async (req, res) => res.json(await asistente.preguntar(req.usuarioId, req.body ?? {}))));
  return r;
}
