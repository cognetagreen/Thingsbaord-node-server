import express from "express";
import { GetBatteryStatusController } from "../../Controller/Battery/GetBatteryStatus.Controller";
import { GetPlantViewTableController } from "../../Controller/PlantView/GetPlantViewTable.Controller";


const GetPlantViewTableRouter = express.Router();

GetPlantViewTableRouter.post('/', GetPlantViewTableController)

export default GetPlantViewTableRouter;