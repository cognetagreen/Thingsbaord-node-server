import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/deviceInfos/all?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
  const ID = jp.query(response.data, '$.data[0].id.id');
  return ID[0];
};

const getStatisticsData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceLabel, telemetry, token } = req.body;
    const deviceID = await getDeviceID(deviceLabel, token);

    try {
      const currentTime = new Date().getTime();
      const prevDay = currentTime - (1000 * 60 * 60 * 24);

      const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries?keys=${telemetry}&startTs=${prevDay}&endTs=${currentTime}&interval=0&limit=3000&agg=NONE&orderBy=ASC&useStrictDataTypes=false`, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });

      const telemetryData = response.data[telemetry];
      // console.log(response.data)
      let sparkValues = jp.query(telemetryData, '$..value');
      if (telemetryData && telemetryData.length > 0) {
        let latestValue, compareValue;
        if(req.body.title === "Total Revenue") {

            latestValue = Number(telemetryData[telemetryData.length - 1].value) * 3;
            compareValue = telemetryData[0].value * 3;
        }else {
            latestValue = Number(telemetryData[telemetryData.length - 1].value);
            compareValue = telemetryData[0].value;
        }
        let stat = 0;
        if (latestValue <= 0) {
          stat = 0;
        }else {

          stat = (latestValue - compareValue)*100 / latestValue;
        }

<<<<<<< HEAD
      // console.log(latestValue, compareValue, stat)
        res.status(200).json( [(latestValue).toFixed(2), (stat).toFixed(2), (sparkValues.map(Number)).slice(-60)] );
=======
      console.log(latestValue, compareValue, stat)
        res.status(200).json( [(latestValue).toFixed(2), (stat).toFixed(2), (sparkValues.map(Number))] );
>>>>>>> f8603801177abfe120430e731a7cb26e6e11e957
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

export { getStatisticsData };
