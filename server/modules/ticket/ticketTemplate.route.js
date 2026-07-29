import express from "express";
import * as templateController from "./ticketTemplate.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", access("*"), templateController.create);
router.get("/active", templateController.getActive);
router.get("/", access("ticket.view_all"), templateController.getAll);
router.get("/:id", access("ticket.view_all"), templateController.getById);
router.put("/:id", access("*"), templateController.update);
router.delete("/:id", access("*"), templateController.remove);

export default router;