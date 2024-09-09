import express from 'express';
import { GetCandleStickChartDataController } from '../Controller/GetCandleStickChartData.Controller';

const GetCandleStickChartDataRouter = express.Router();

GetCandleStickChartDataRouter.post('/', GetCandleStickChartDataController);

export default GetCandleStickChartDataRouter;