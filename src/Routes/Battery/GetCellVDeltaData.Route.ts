import express from 'express'
import { GetCellVDeltaController } from '../../Controller/Battery/GetCellVDeltaData.Controller';

const GetCellVDeltaDataRouter = express.Router();

GetCellVDeltaDataRouter.post("/", GetCellVDeltaController);

export default GetCellVDeltaDataRouter;