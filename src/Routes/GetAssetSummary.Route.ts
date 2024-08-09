import express from 'express';
import { GetAssetSummaryController } from '../Controller/GetAssetSummary.Controller';

const GetAssetSummaryRouter = express.Router();

GetAssetSummaryRouter.post('/', GetAssetSummaryController);

export default GetAssetSummaryRouter;