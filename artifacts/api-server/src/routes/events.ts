import { Router } from "express";
import { addSSEClient } from "../lib/sse.js";

const router = Router();

router.get("/events", (req, res) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  addSSEClient(id, res);
});

export default router;
