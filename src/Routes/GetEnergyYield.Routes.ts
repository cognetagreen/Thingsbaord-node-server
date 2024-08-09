import express from 'express';
import { GetEnergyYieldController } from '../Controller/GetEnergyYield.Controller';

const GetEnergyYieldRouter = express.Router();

GetEnergyYieldRouter.post('/', GetEnergyYieldController);

export default GetEnergyYieldRouter;