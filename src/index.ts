import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import StatisticsRoute from './Routes/Statistics.CardRoute';
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
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, World!');
});

app.use("/api/getStatisticsData", StatisticsRoute)

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
