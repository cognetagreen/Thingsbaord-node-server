import express from "express";
import { GetBatteryStatusController } from "../../Controller/Battery/GetBatteryStatus.Controller";
import { GetBESSDailyController } from "../../Controller/Battery/GetBESSDaily.Controller";


const GetBESSDailyRouter = express.Router();

GetBESSDailyRouter.post('/', GetBESSDailyController)

export default GetBESSDailyRouter;