import express from 'express';
import { GetPlantTableSummaryController } from '../Controller/GetPlantTableSummaryData.Controller';

const GetPlantTableSummaryData = express.Router();

GetPlantTableSummaryData.post('/', GetPlantTableSummaryController);

export default GetPlantTableSummaryData;