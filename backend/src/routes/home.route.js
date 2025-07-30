import express from "express"
import { add, edit } from "../controllers/home.controller.js"

const router = express.Router()

router.get("/add page", add)
router.get("/edit", edit)

export default router