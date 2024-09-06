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
import GetGeneratorTableRouter from './Routes/GetGeneratorTable.Route';
import GetBatteryStatusRouter from './Routes/Battery/GetBatteryStatus.Route';
import GetBESSDailyRouter from './Routes/Battery/GetBESSDaily.Route';
import GetSomeTitleRouter from './Routes/Battery/GetSomeTitle.Route';
import GetCellVDeltaDataRouter from './Routes/Battery/GetCellVDeltaData.Route';
import GetPlantCardRouter from './Routes/PlantVeiw/GetPlantCard.Route';
import GetPlantViewTableRouter from './Routes/PlantVeiw/GetPlantViewTable.Route';
import GetManyDeviceSameKeyChartRouter from './Routes/GetManyDeviceSameKeyChart.Route';
import GetManyDeviceManyKeysRouter from './Routes/GetManyDeviceManyKeys.Route';
import GetLiveAlarmRouter from './Routes/Alarm/GetLiveAlarm.Route';
import GetManyDeviceManyKeysLastValueRouter from './Routes/GetManyDeviceManyKeysLastValue.Route';
import GetPlantTableRouter from './Routes/GetPlantTable.Route';
import GetPlantTableSummaryData from './Routes/GetPlantTableSummary.Route';
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
app.use("/api/v1/getManyDeviceSameKeyChartData", GetManyDeviceSameKeyChartRouter)
app.use("/api/v1/GetManyDeviceManyKeysChartData", GetManyDeviceManyKeysRouter);
app.use("/api/v1/GetManyDeviceManyKeysChartData/LastValue", GetManyDeviceManyKeysLastValueRouter);
app.use("/api/v1/getPlantTableData", GetPlantTableRouter);
app.use("/api/v1/getPlantTableSummaryData", GetPlantTableSummaryData);

// Battery
app.use("/api/v1/getBatteryStatusData", GetBatteryStatusRouter);
app.use("/api/v1/getBESSDailyData", GetBESSDailyRouter);
app.use("/api/v1/getSomeTitleData", GetSomeTitleRouter);
app.use("/api/v1/getCellVDeltaData", GetCellVDeltaDataRouter);

// Plant View
app.use("/api/v1/getPlantCardData", GetPlantCardRouter);
app.use("/api/v1/getPlantViewTableData", GetPlantViewTableRouter);


// Widget Table Routes
app.use("/api/v1/getGeneratorTableData", GetGeneratorTableRouter);


// Alarm
app.use("/api/v1/getLiveAlarmTableData", GetLiveAlarmRouter);


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});