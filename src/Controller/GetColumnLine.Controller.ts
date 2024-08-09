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
// interface typeType {
//     column : string;
//     line : string;
// }
const GetColumnLineController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { textSearch, type, token } = req.body;
    const deviceDetails = await getDeviceDetails(textSearch, token);

    let series = [];
    const endTs = new Date().getTime();
    const startTs = endTs - (24*60*60*1000*7); // last 7 days
    for(var i = 0; i < Object.entries(type).length; i++) {
        if(i == 0) { // This is for Column!  ((2 Column))
            const keys = Object.values(type)[i];
            let columnsData = [];
            let columnTs = [];
            for(var j = 0; j < deviceDetails.length; j++) {
                const id = deviceDetails[j].id;
                try {
                  const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${keys}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${24*60*60*1000}&limit=100&agg=SUM`, {
                    headers: { 'X-Authorization': `Bearer ${token}` }
                  });
                  const value = jp.query(response.data, '$..value');
                  const ts = jp.query(response.data, '$..ts');
                  // console.log(response.data)
                  // console.log(value)
                  columnsData.push((value));
                  columnTs.push(ts);
                } catch (error) {
                  console.error(`Error fetching telemetry data for device ${id}:`, error);
                } 
            };

            let sum = []
            for(var k = 0; k < columnsData[0].length; k++) {
              var title = ["Daily Energy", "Energy Consumption"]
              var data = {
                name : title[k],
                type : "column",
                data : [(columnTs[0][k+7]||0), (parseFloat(columnsData[0][k])||0) + (parseFloat(columnsData[1][k+7])|| 0)]
              }
              sum.push((parseFloat(columnsData[0][k]) + parseFloat(columnsData[1][k+7])).toFixed(2));
              series.push(data);
            }
        } else if(i==1) {
            const keys = Object.values(type)[i];
            let lineData = [];
            let lineTs = [];
            for(var j = 0; j < deviceDetails.length; j++) {
              const id = deviceDetails[j].id;
              try {
                const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${keys}&startTs=${startTs}&endTs=${endTs}&intervalType=MILLISECONDS&interval=${24*60*60*1000}&limit=100&agg=AVG`, {
                  headers: { 'X-Authorization': `Bearer ${token}` }
                });
                const value = jp.query(response.data, '$..value');
                const ts = jp.query(response.data, '$..ts');
                // console.log(response.data)
                // console.log(value)
                lineData.push((value));
                lineTs.push(ts);
              } catch (error) {
                console.error(`Error fetching telemetry data for device ${id}:`, error);
              } 
            };
            let sum = [];
            for(var k = 0; k < lineData[0].length; k++) {
              sum.push(((parseFloat(lineData[0][k]) || 0) + parseFloat(lineData[1][k+7]) || 0).toFixed(2));
            }
            // console.log(sum);
            var plotLine = []
            for(var k = 0; k < lineData[0].length; k++) {
              const PV_PR = (parseFloat(sum[0+7])*100)/(parseFloat(sum[1+7])*parseFloat(sum[2+7])) || 0;
              const Wind_PR = parseFloat(sum[3+7])/(parseFloat(sum[4+7])*24*0.2) || 0;
              const BESS_PR = (parseFloat(sum[5+7])/parseFloat(sum[6+7]))*100 || 0;
              plotLine.push([(lineTs[0][k+7] || 0), (PV_PR+Wind_PR+BESS_PR)])
            }
            var pata = {
              name : "PR Value of Total Portfolio",
              type : "spline",
              data : plotLine
            };
            series.push(pata);
          }

          // console.log(series);
      }


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

export { GetColumnLineController };
