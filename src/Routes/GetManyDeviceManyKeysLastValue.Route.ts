import express from 'express';
import { GetManyDeviceManyKeysLastValueController } from '../Controller/GetManyDeviceManyKeysLastValueController';

const GetManyDeviceManyKeysLastValueRouter = express.Router();

GetManyDeviceManyKeysLastValueRouter.post('/', GetManyDeviceManyKeysLastValueController);

export default GetManyDeviceManyKeysLastValueRouter;