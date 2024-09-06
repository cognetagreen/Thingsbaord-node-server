import axios from 'axios';
import { Request, Response } from 'express';
const jp = require('jsonpath');

const BASE_URL = "https://cogneta.cloud/api";

interface CustomerDetailsType {
  id: string;
}

interface DeviceDetailsType {
  name: string;
  id: string;
  ownerName: string;
}

const getCustomersDetails = async (textSearch: string, Token: string): Promise<CustomerDetailsType[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/user/customers?pageSize=10&page=0&sortProperty=createdTime&textSearch=${textSearch}`, {
      headers: { 'X-Authorization': `Bearer ${Token}` }
    });
      const id = jp.query(response.data, '$.data[*].id.id');
      const customerDetails = id.map((value: any, index: any) => ({
        id: id[index],
      }));

      return customerDetails;
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return [];
  }
};

const getDeviceDetails = async (device: string, customerID: string, Token: string): Promise<DeviceDetailsType[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/customer/${customerID}/deviceInfos?pageSize=200&page=0&textSearch=${device}&sortProperty=label&sortOrder=ASC&includeCustomers=true`, {
      headers: { 'X-Authorization': `Bearer ${Token}` }
    });

    const name = jp.query(response.data, '$.data[*].label');
    const id = jp.query(response.data, '$.data[*].id.id');
    const devName = jp.query(response.data, '$.data[*].name');

    const deviceDetails = name.map((value: any, index: any) => ({
      name: name[index],
      id: id[index],
      ownerName: devName[index],
    }));

    return deviceDetails;
  } catch (error) {
    console.error("Error fetching device details:", error);
    return [];
  }
};

const GetPlantTableSummaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { searchTag, textSearch, token } = req.body;
    // console.log("searchTag:", searchTag, "textSearch:", textSearch);

    let series = [];

    for (const text of textSearch) {
      console.log("Processing text search:", text);
      let TotalPlant = 0;
      let TotalPlantRunning = 0;
      let TotalPlantHalt = 0;
      let TotalPlantDeactive = 0;

      const customerDetails = await getCustomersDetails(text, token);
    //   console.log("customerDetails:", customerDetails);

      if (customerDetails.length > 0) {
        TotalPlant = customerDetails.length;

        for (const { id } of customerDetails) {
          // Iterate over each device in the searchTag
          for (const [device, key] of Object.entries(searchTag)) {
            const deviceDetails = await getDeviceDetails(`${device}`, id, token);
            // console.log("deviceDetails:", deviceDetails);

            // Sequentially fetch telemetry data for each device
            for (const deviceInfo of deviceDetails) {
              const deviceId = deviceInfo.id;
              const stringKey = key as string;
              const newKey = stringKey.replace(/0/g, (deviceInfo.name).split("-")[1]); // DG-2 => ["DG", 2]

              try {
                const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${newKey}`, {
                  headers: { 'X-Authorization': `Bearer ${token}` }
                });

                // console.log("device Data : ",response.data)

                const value = jp.query(response.data, '$..value') as string[];
                const ts = jp.query(response.data, '$..ts') as number[];

                const currentTime = new Date().getTime();
                const prevTime = currentTime - 1000 * 60 * 11;
                if(value[0] != null) {
                    if (ts[0] > prevTime && ts[0] <= currentTime) {
                      if (parseFloat(value[0]) > 0) {
                        TotalPlantRunning += 1;
                      } else if (parseFloat(value[0]) === 0) {
                        TotalPlantHalt += 1;
                      }
                    } else {
                      console.log(deviceInfo.name)
                      TotalPlantDeactive += 1;
                    }
                } else {
                    TotalPlantDeactive += 1;
                }
              } catch (error) {
                TotalPlantDeactive += 1;
                console.error(`Error fetching telemetry data for device ${deviceId}:`, error);
                continue; // Skip to the next device if there's an error
              }
            }
          }
        }
      } else {
        series.push([TotalPlant, TotalPlantRunning, TotalPlantHalt, TotalPlantDeactive]);
        continue;
      }
      if(text == "kW") {
        series.push([TotalPlantRunning, TotalPlantHalt, TotalPlantDeactive]);
      }else {
        series.push([TotalPlant, TotalPlantRunning, TotalPlantHalt, TotalPlantDeactive]);
      }
    //   console.log("series", series);
    }

    const filteredSeries = series.filter((s) => s !== null);

    if (filteredSeries.length > 0) {
      res.status(200).json( filteredSeries );
    } else {
      res.status(404).json({ error: "No telemetry data found" });
    }
  } catch (error) {
    console.error("Error in GetPlantTableSummaryController:", error);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
};

export { GetPlantTableSummaryController };
