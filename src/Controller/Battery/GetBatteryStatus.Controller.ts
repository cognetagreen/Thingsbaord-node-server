import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceID = async (Label: string, Token: string, CustomerID: string): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos`, {
    params: {
      pageSize: 20,
      page: 0,
      textSearch: Label,
      sortProperty: 'createdTime',
      sortOrder: 'ASC',
      includeCustomers: true,
    },
    headers: { 'X-Authorization': `Bearer ${Token}` },
  });
  const ID = jp.query(response.data, '$.data[*].id.id');
  return ID[0];
};

const fetchTelemetryData = async (
  deviceID: string,
  token: string,
  keys: string,
  startTs?: number,
  endTs?: number,
  agg: string = 'NONE',
  intervalType?: string
) => {
  const params: any = { keys, agg };

  if (startTs && endTs) {
    params.startTs = startTs;
    params.endTs = endTs;
  }
  if (intervalType) {
    params.intervalType = intervalType;
  }

  const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceID}/values/timeseries`, {
    params,
    headers: { 'X-Authorization': `Bearer ${token}` },
  });

  return response.data;
};

const GetBatteryStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, token, customerID } = req.body;
    const deviceID = await getDeviceID(search.devName, token, customerID);

    let startTs: number | undefined, endTs: number | undefined, agg = 'NONE', intervalType;

    if (search.special === "7daysSOCavg") {
      endTs = Date.now();
      startTs = endTs - 1000 * 60 * 60 * 24 * 7;
      agg = 'AVG';
      intervalType = 'WEEK';
    } else if (search.special === "temp30") {
      endTs = Date.now();
      startTs = endTs - 1000 * 60 * 30;
      agg = 'NONE';
    }

    const telemetryData = await fetchTelemetryData(deviceID, token, search.keys, startTs, endTs, agg, intervalType);

    if (telemetryData) {
      const values = jp.query(telemetryData, "$..value") as string[];

      if (search.special === "7daysSOCavg") {
        const totalValue = values.reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue), 0);
        res.status(200).json(totalValue.toFixed(2));
      } else if (search.special === "temp30") {
        const percentageAbove30 = values.filter((value) => parseFloat(value) > 30).length / values.length * 100;
        res.status(200).json(percentageAbove30.toFixed(2));
      } else {
        const parsedValues = values.map(value => parseFloat(parseFloat(value).toFixed(2)));
        res.status(200).json(parsedValues);
      }
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error processing request", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

export { GetBatteryStatusController };
