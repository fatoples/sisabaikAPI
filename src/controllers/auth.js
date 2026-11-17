import * as service from "../services/auth.js";
import {
  registrasiValid,
  registrasiPenyediaValid,
  loginValid,
} from "../lib/input-auth.js";
import { cabutToken } from "../repositories/pengguna.js";

export async function registrasi(req, res) {
  const data = await service.registrasi(registrasiValid(req.body));
  return res.status(201).json({ success: true, data });
}

export async function login(req, res) {
  const data = await service.login(loginValid(req.body));
  return res.json({ success: true, data });
}

export async function registrasiPenyedia(req, res) {
  const data = await service.registrasiPenyedia(
    registrasiPenyediaValid(req.body),
  );
  return res.status(201).json({ success: true, data });
}

export function saya(req, res) {
  return res.json({ success: true, data: req.pengguna });
}

export async function logout(req, res) {
  await cabutToken(req.pengguna.id);
  return res.status(204).end();
}