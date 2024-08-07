import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string, CustomerID : string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  })
  const ID = jp.query(response.data, '$.data[*].id.id');
<<<<<<< HEAD
=======
  console.log(ID, ID[0])
>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
  return ID[0];
};

const getLatestValueCardData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceLabel, telemetry, token, customerID } = req.body;
      const deviceID = await getDeviceID(deviceLabel, token, customerID);
  
      try {
        const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries?keys=${telemetry}`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
  
        const telemetryData = response.data[telemetry];
        
        // Check if telemetryData is defined and has at least one element
        if (telemetryData && telemetryData.length > 0) {
          const latestValue = Number(telemetryData[0].value);
          res.status(200).json([(latestValue).toFixed(2)]);
        } else {
          res.status(404).json({ error: "No telemetry data found" });
        }
      } catch (error) {
        console.error("Error fetching telemetry data", error);
        res.status(500).json({ error: "Failed to fetch telemetry data" });
      }
    } catch (error) {
      console.error("Error fetching device ID", error);
      res.status(500).json({ error: "Failed to fetch device ID" });
    }
  };
  

export { getLatestValueCardData };
