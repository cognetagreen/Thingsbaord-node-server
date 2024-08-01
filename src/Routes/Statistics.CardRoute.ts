import express from 'express';
import { getData } from '../Controller/StatisticsCard.Controller';


const router = express.Router();

router.post('/', getData)

export default router;