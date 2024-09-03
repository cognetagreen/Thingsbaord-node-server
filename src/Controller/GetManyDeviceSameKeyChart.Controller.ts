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
  const response = await axios.get(`${BASE_URL}/customer/${CustomerID}/deviceInfos`, {
    params: {
      pageSize: 20,
      page: 0,
      textSearch: Label,
      sortProperty: 'label',
      sortOrder: 'ASC',
      includeCustomers: true
    },
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });

  const names = jp.query(response.data, '$.data[*].label');
  const ids = jp.query(response.data, '$.data[*].id.id');
  const ownerNames = jp.query(response.data, '$.data[*].ownerName');

  return names.map((name: string, index: number) => ({
    name,
    id: ids[index],
    ownerName: ownerNames[index],
  }));
};

interface TimeWindowType {
  startTs: number;
  endTs: number;
  aggregate: string;
  interval: number;
}

interface TimeSeries {
  ts: number;
  value: string;
}

const GetManyDeviceSameKeyChartController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, timeWindow, token, customerID } = req.body;
    const { startTs, endTs, aggregate, interval } = timeWindow as TimeWindowType;

    const deviceDetails = await getDeviceID(`${searchTag.devName}-`, token, customerID);
    let series: any[] = [];
    let errors: string[] = [];  // Collect errors to send a consolidated error response

    // Use Promise.all to ensure all asynchronous operations are handled
    await Promise.all(
      deviceDetails.map(async (deviceInfo) => {
        console.log(deviceDetails, 999999999999999999999)
        const id = deviceInfo.id;
        const stringKey = searchTag.keys as string;
        const newKey = stringKey.replace(/0/g, deviceInfo.name.split("-")[1]);

        try {
          const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries`, {
            params: {
              keys: newKey,
              startTs,
              endTs,
              intervalType: 'MILLISECONDS',
              interval,
              limit: 5000,
              agg: aggregate,
              orderBy: 'ASC',
              useStrictDataTypes: false
            },
            headers: { 'X-Authorization': `Bearer ${token}` }
          });

          const telemetryData = response.data;

          if (telemetryData && telemetryData[newKey]) {
            const values = telemetryData[newKey] as TimeSeries[];
            const seriesData = values.map(elem => [elem.ts, parseFloat(parseFloat(elem.value).toFixed(2))]);

            series.push({
              type: searchTag.type,
              name: searchTag.name + deviceInfo.name.split("-")[1],
              data: seriesData,
              marker: { enabled: false }
            });
          }
        } catch (error:any) {
          console.error(`Error fetching telemetry data for device ${id}`, error);
          errors.push(`Error fetching telemetry data for device ${id}: ${error.message}`);
        }
      })
    );

    // Send response after all operations are complete
    if (series.length > 0) {
      res.status(200).json(series);
    } else if (errors.length > 0) {
      res.status(500).json({ errors });  // Send all collected errors in one response
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error fetching device ID", error);
    res.status(500).json({ error: "Failed to fetch device ID" });
  }
};

export { GetManyDeviceSameKeyChartController };
