import express from "express";
import { GetBatteryStatusController } from "../../Controller/Battery/GetBatteryStatus.Controller";
import { GetPlantCardController } from "../../Controller/PlantView/GetPlantCard.Controller";


const GetPlantCardRouter = express.Router();

GetPlantCardRouter.post('/', GetPlantCardController)

export default GetPlantCardRouter;