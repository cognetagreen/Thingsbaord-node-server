import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string, CustomerID : string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  })
  const ID = jp.query(response.data, '$.data[*].id.id');
  return ID[0];
};

const GetBatteryStatusController = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, token, customerID } = req.body;
      console.log(search, token, customerID)
      const deviceID = await getDeviceID(search.devName, token, customerID);
      console.log("deviceID : ", deviceID)
      try {
        const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries?keys=${search.keys}`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
        
        const telemetryData = response.data;
            console.log(telemetryData);
        // Check if telemetryData is defined and has at least one element
        if (telemetryData) {
            const values = jp.query(telemetryData, "$..value") as [];
            console.log(values)
          const latestValue = values.map(elem => parseFloat(elem).toFixed(2));
          res.status(200).json(latestValue);
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
  

export { GetBatteryStatusController };
