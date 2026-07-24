import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as searchController from "./search.controller.js";

const router = express.Router();

router.use(protect);

router.get("/query", searchController.query);

export default router;
