import express from 'express'
import { GetCustomerController, GetCustomersController } from '../Controller/GetCustomers.Controller';

const GetCustomersRoutes = express.Router();
// For Multiple Customers e.g. Deif India
GetCustomersRoutes.post('/', GetCustomersController);

// For Individual Customer e.g. Durtek Lanka
GetCustomersRoutes.post('/:id', GetCustomerController)

export default GetCustomersRoutes;