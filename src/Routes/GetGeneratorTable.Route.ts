import express from 'express';
import { GetGeneratorTableController } from '../Controller/GetGeneratorTable.Controller';

const GetGeneratorTableRouter = express.Router();

GetGeneratorTableRouter.post('/', GetGeneratorTableController);

export default GetGeneratorTableRouter;