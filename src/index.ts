import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import StatisticsCardRouter from './Routes/Statistics.CardRoute';
import LatestValueCardRouter from './Routes/LatestValueCard.Route';
import GetCustomersRoutes from './Routes/GetCustomers.Route';
import GetSpecificYieldRouter from './Routes/GetSpecificYield.Route';
import GetColumnLineRouter from './Routes/GetColumnLine.Route';
import GetEnergyYieldRouter from './Routes/GetEnergyYield.Routes';
import GetAssetSummaryRouter from './Routes/GetAssetSummary.Route';
const cors = require('cors');

const app = express();


const port = process.env.PORT || 6921;

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(bodyParser.json());


// CORS
app.use(cors());


// Define a simple route
// app.get('/', (req: Request, res: Response) => {
//     res.send('Hello, World!');
// });

// Routes

// Customer Routes
app.use("/api/v1/getCustomers", GetCustomersRoutes);
app.use("/api/v1/getCustomer", GetCustomersRoutes);
// Card Routes
app.use("/api/v1/getStatisticsData", StatisticsCardRouter);
app.use("/api/v1/getLatestValueCardData", LatestValueCardRouter);
// Widget Chart Routes
app.use("/api/v1/getSpecificYield", GetSpecificYieldRouter);
app.use("/api/v1/getColumnLine", GetColumnLineRouter);
app.use("/api/v1/getCustomers", GetCustomersRoutes);
app.use("/api/v1/getStatisticsData", StatisticsCardRouter);
app.use("/api/v1/getLatestValueCardData", LatestValueCardRouter);
app.use("/api/v1/getEnergyYieldData", GetEnergyYieldRouter);
app.use("/api/v1/getAssetSummaryData", GetAssetSummaryRouter);


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});