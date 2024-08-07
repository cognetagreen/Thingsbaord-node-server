import express from 'express';
import { GetSpecificYieldController } from '../Controller/GetSpecificYield.Controller';

const GetSpecificYieldRouter = express.Router();

GetSpecificYieldRouter.post('/', GetSpecificYieldController);

export default GetSpecificYieldRouter;