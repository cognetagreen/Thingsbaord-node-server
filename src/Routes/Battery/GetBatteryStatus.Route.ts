import express from "express";
import { GetBatteryStatusController } from "../../Controller/Battery/GetBatteryStatus.Controller";


const GetBatteryStatusRouter = express.Router();

GetBatteryStatusRouter.post('/', GetBatteryStatusController)

export default GetBatteryStatusRouter;