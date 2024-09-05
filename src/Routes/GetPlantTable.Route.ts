import express from 'express';
import { GetPlantTableController } from '../Controller/GetPlantTable.Controller';

const GetPlantTableRouter = express.Router();

GetPlantTableRouter.post('/', GetPlantTableController);

export default GetPlantTableRouter;