import express from 'express';
import {GetManyDeviceManyKeysController} from '../Controller/GetManyDeviceManyKeys.Controller';

const GetManyDeviceManyKeysRouter = express.Router();

GetManyDeviceManyKeysRouter.post('/', GetManyDeviceManyKeysController);

export default GetManyDeviceManyKeysRouter;