import express from 'express';
import { GetLocationMapController } from '../Controller/GetLocationMapData.Controller';

const GetLocationMapDataRouter = express.Router();

GetLocationMapDataRouter.post("/", GetLocationMapController);

export default GetLocationMapDataRouter;