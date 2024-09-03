import express from "express";
import { GetLiveAlarmController } from "../../Controller/Alarm/GetLiveAlarm.Controller";


const GetLiveAlarmRouter = express.Router();

GetLiveAlarmRouter.post('/', GetLiveAlarmController)

export default GetLiveAlarmRouter;