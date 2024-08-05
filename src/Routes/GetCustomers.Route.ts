import express from 'express'
import { GetCustomersController } from '../Controller/GetCustomers.Controller';

const GetCustomersRoutes = express.Router();

GetCustomersRoutes.post('/', GetCustomersController);

export default GetCustomersRoutes;