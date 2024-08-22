import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

interface DeviceDetailsType {
  name: string;
  id: string;
  ownerName: string;
}

const getDeviceID = async (Label: string, Token: string, CustomerID: string): Promise<DeviceDetailsType[]> => {
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos?pageSize=20&page=0&textSearch=${Label}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });
  const name = jp.query(response.data, '$.data[*].label');
  const id = jp.query(response.data, '$.data[*].id.id');
  const ownerName = jp.query(response.data, '$.data[*].ownerName');
  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    ownerName: ownerName[index],
  }));

  return deviceDetails;
};

const getSomeTitleControllerData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, token, customerID } = req.body;
    const sparkBarKeys = searchTag.sparkBarKeys as string;
    const keys = searchTag.keys as string;
    const deviceDetails = await getDeviceID(searchTag.devName, token, customerID);
    const series = [];

    for (const deviceInfo of deviceDetails) {
      const newSparkBarKeys = sparkBarKeys.replace("0", (deviceInfo.name).split("-")[1]);
      const newKeys = keys.replace("0", (deviceInfo.name).split("-")[1]);

      try {
        const responseBar = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceInfo.id}/values/timeseries?keys=${newSparkBarKeys}`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });

        const telemetryData = responseBar.data;
        const sparkBarData = [];
        const responseKeys = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceInfo.id}/values/timeseries?keys=${newKeys}`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });

        const telemetryKeysData = responseKeys.data;
        const keysData = [];

        // Check if telemetryData is defined and has at least one element
        if (Object.entries(telemetryData).length > 0 && Object.entries(telemetryKeysData).length > 0) {
          const value = jp.query(telemetryData, "$..value") as string[];
          const values = value.map(elem => parseFloat(parseFloat(elem).toFixed(2)));
          sparkBarData.push(values[0], 100 - values[0], value[1]);
          const keyValues = jp.query(telemetryKeysData, "$..value") as string[];
          keysData.push(keyValues.map(elem => parseFloat(parseFloat(elem).toFixed(2))));
          series.push({
            bar: sparkBarData,
            temp: keysData[0][0],
            volt: keysData[0][1]
          });
        }
      } catch (error) {
        console.error("Error fetching telemetry data", error);
        res.status(500).json({ error: "Failed to fetch telemetry data" });
      }
    }

    if (series.length > 0) {
      res.status(200).json(series);
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error fetching device ID", error);
    res.status(500).json({ error: "Failed to fetch device ID" });
  }
};

export { getSomeTitleControllerData };
