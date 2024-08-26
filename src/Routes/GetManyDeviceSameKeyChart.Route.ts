import express from 'express';
import { GetManyDeviceSameKeyChartController } from '../Controller/GetManyDeviceSameKeyChart.Controller';

const GetManyDeviceSameKeyChartRouter = express.Router();

GetManyDeviceSameKeyChartRouter.post('/', GetManyDeviceSameKeyChartController);

export default GetManyDeviceSameKeyChartRouter;
