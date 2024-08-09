import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceDetails = async (textSearch: string, Token: string): Promise<deviceDetailsType[]> => {
  const response = await axios.get(`${BASE_URL}/deviceInfos/all?pageSize=20&page=0&textSearch=${textSearch}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`, {
    headers: { 'X-Authorization': `Bearer ${Token}` }
  });

  const name = jp.query(response.data, '$.data[*].name');
  const id = jp.query(response.data, '$.data[*].id.id');
  const ownerName = jp.query(response.data, '$.data[*].ownerName');
  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    ownerName: ownerName[index],
  }));

  return deviceDetails;
};

interface deviceDetailsType {
    name : string;
    id : string;
    ownerName : string;
}

const GetEnergyYieldController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { textSearch, key, token } = req.body;
    const deviceDetails = await getDeviceDetails(textSearch, token);

    let series = [];

    const keys = key.split(",") as string;
    // for(var i = 0; i < keys.length; i++) {
            let pieData = [];
            let columnTs = [];
            for(var j = 0; j < deviceDetails.length; j++) {
                const id = deviceDetails[j].id;
                try {
                  const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${keys}`, {
                    headers: { 'X-Authorization': `Bearer ${token}` }
                  });
                  const value = jp.query(response.data, '$..value');
                  const ts = jp.query(response.data, '$..ts');
                  // console.log(response.data)
                  // console.log(value)
                  pieData.push((value));
                  columnTs.push(ts);
                } catch (error) {
                  console.error(`Error fetching telemetry data for device ${id}:`, error);
                } 
            };

            for(var k = 0; k < pieData[0].length; k++) {
              var title = ["PV%", "Wind%", "BESS%", "DG%"]
              var data = {
                name : title[k],
                y : (parseFloat(pieData[0][k])||0) + (parseFloat(pieData[1][k])|| 0) / 1 // 1 - Total Power Of Plant
              }
              series.push(data);
            }

        // console.log(series);
    //   }


    // Filter out any null results (devices that failed to fetch or had no data)
    const filteredSeries = series.filter((s) => s !== null);

    if (filteredSeries.length > 0) {
      // console.log(filteredSeries)
      res.status(200).json(filteredSeries);
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error fetching device details", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetEnergyYieldController };
