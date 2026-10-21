import { Router } from "express";
import { ah } from "../utils/async.js";
import { firmarToken } from "../utils/token.js";
import { limitarIntentos } from "../middleware/limitar.js";

export function authRoutes({ usuarios }, config, autenticar) {
  const r = Router();
  const limite = limitarIntentos();
  const sesion = (usuario) => ({ token: firmarToken(usuario, config.jwt.secreto, config.jwt.expira), usuario });

  r.post("/registro", limite, ah(async (req, res) => {
    res.status(201).json(sesion(await usuarios.registrar(req.body ?? {})));
  }));

  r.post("/login", limite, ah(async (req, res) => {
    res.json(sesion(await usuarios.autenticar(req.body ?? {})));
  }));

  r.get("/yo", autenticar, ah(async (req, res) => {
    res.json({ usuario: await usuarios.obtener(req.usuarioId) });
  }));

  return r;
}
