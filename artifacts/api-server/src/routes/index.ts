import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import categoriesRouter from "./categories.js";
import menuRouter from "./menu.js";
import ordersRouter from "./orders.js";
import settingsRouter from "./settings.js";
import eventsRouter from "./events.js";
import uploadRouter from "./upload.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(categoriesRouter);
router.use(menuRouter);
router.use(ordersRouter);
router.use(settingsRouter);
router.use(eventsRouter);

export default router;
