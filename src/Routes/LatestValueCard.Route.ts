import express from "express";
import { getLatestValueCardData } from "../Controller/LatestValueCard.Controller";


const LatestValueCardRouter = express.Router();

LatestValueCardRouter.post('/', getLatestValueCardData)

export default LatestValueCardRouter;