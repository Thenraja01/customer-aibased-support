import express from "express";
import * as searchController from "./search.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", searchController.global);
router.get("/documents", searchController.documents);
router.get("/tickets", restrict("admin", "support"), searchController.tickets);

export default router;
