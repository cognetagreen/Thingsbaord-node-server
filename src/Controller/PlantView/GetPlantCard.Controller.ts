import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://api.cogneta.cloud/api/sql"; // Last Node Server For PostgreSQL

const GetPlantCardController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, customerID, DataLabel, token } = req.body;
    const series: string[][] = [];
    const DIFF = ["daily", "month", "year"];
    const parsedSearch = JSON.parse(searchTag);
    const keys = jp.query(parsedSearch, "$..values");

    console.log('Received searchTag:', searchTag, 'DataLabel:', DataLabel);

    for (const diff of DIFF) {
      try {
        const response = await axios.get(`${BASE_URL}/SELECT * FROM fn_get_PlantViewCard('${customerID}','${diff}','${searchTag}')`);
        const responseData = response?.data.rows;

        if (responseData && responseData.length) {
          const value: string[] = keys.map((key: string) => {
            const matchedRow = responseData.find((row: any) => row.key_1 === key);
            return matchedRow ? matchedRow.result_set : "0";
          });
          series.push(value);
        } else {
          // If no data is found, push zeros
          series.push(new Array(keys.length).fill("0"));
        }
      } catch (error) {
        console.error(`Error fetching data for ${diff} period:`, error);
        // Push zeros for each key if an error occurs
        series.push(new Array(keys.length).fill("0"));
      }
    }

    if (series.length > 0) {
      res.status(200).json(series);
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error in GetPlantCardController:", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetPlantCardController };
