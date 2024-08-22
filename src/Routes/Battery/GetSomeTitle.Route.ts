import express from 'express'
import { getSomeTitleControllerData } from '../../Controller/Battery/GetSomeTitle.Controller';

const GetSomeTitleRouter = express.Router();

GetSomeTitleRouter.post('/', getSomeTitleControllerData);

export default GetSomeTitleRouter;