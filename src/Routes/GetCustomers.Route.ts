import express from 'express'
<<<<<<< HEAD
import { GetCustomerController, GetCustomersController } from '../Controller/GetCustomers.Controller';

const GetCustomersRoutes = express.Router();
// For Multiple Customers e.g. Deif India
GetCustomersRoutes.post('/', GetCustomersController);

// For Individual Customer e.g. Durtek Lanka
GetCustomersRoutes.post('/:id', GetCustomerController)

=======
import { GetCustomersController } from '../Controller/GetCustomers.Controller';

const GetCustomersRoutes = express.Router();

GetCustomersRoutes.post('/', GetCustomersController);

>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
export default GetCustomersRoutes;