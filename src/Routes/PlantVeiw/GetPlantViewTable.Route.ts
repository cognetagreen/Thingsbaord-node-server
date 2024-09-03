import express from "express";
import { GetPlantViewTableController } from "../../Controller/PlantView/GetPlantViewTable.Controller";


const GetPlantViewTableRouter = express.Router();

GetPlantViewTableRouter.post('/', GetPlantViewTableController)

export default GetPlantViewTableRouter;