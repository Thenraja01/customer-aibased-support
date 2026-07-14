import express from "express";
import { register ,login} from "../service/auth.service.js";

const router = express.Router();

router.post("/v1/register", async (req, res) => {
  try {
    const result = await register(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.post("/v1/login", async (req, res) => {
  try {
    const result = await login(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      data: result.user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;