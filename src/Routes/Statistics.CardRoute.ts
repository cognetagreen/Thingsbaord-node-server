import express from 'express';
import { getStatisticsData } from '../Controller/StatisticsCard.Controller';


const StatisticsCardRouter = express.Router();

StatisticsCardRouter.post('/', getStatisticsData)

export default StatisticsCardRouter;