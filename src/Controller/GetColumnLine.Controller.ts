import axios from "axios";
import { Request, Response } from "express";
const jp = require("jsonpath");

const BASE_URL = "https://cogneta.cloud/api";

const getDeviceDetails = async (
  textSearch: string,
  Token: string
): Promise<deviceDetailsType[]> => {
  const response = await axios.get(
    `${BASE_URL}/deviceInfos/all?pageSize=20&page=0&textSearch=${textSearch}&sortProperty=createdTime&sortOrder=ASC&includeCustomers=true`,
    {
      headers: { "X-Authorization": `Bearer ${Token}` },
    }
  );

  const name = jp.query(response.data, "$.data[*].name");
  const id = jp.query(response.data, "$.data[*].id.id");
  const ownerName = jp.query(response.data, "$.data[*].ownerName");
  const deviceDetails = name.map((value: any, index: any) => ({
    name: name[index],
    id: id[index],
    ownerName: ownerName[index],
  }));

  return deviceDetails;
};

interface deviceDetailsType {
  name: string;
  id: string;
  ownerName: string;
}

interface TimeSeriesType {
  ts: number;
  value: string;
}
// interface typeType {
//     column : string;
//     line : string;
// }
const GetColumnLineController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { textSearch, type, token } = req.body;
    const deviceDetails = await getDeviceDetails(textSearch, token);
    // console.log("deviceDetails : ", deviceDetails);

    const columnName = ["Daily Energy", "Energy Consumption"];
    const lineName = "PR";

    let series = [] as object[];
    const endTs = new Date().getTime();
    const startTs = endTs - 24 * 60 * 60 * 1000 * 7; // last 7 days
    for (var i = 0; i < Object.entries(type).length; i++) {
      if (i == 0) {
        // This is for Column!  ((2 Column))
        const keys = Object.values(type)[i] as string;
        const key = keys.split(",");
        
        for (const [index, name] of key.entries()) {
          let columnsData = [] as number[][];
          let columnTs = [] as number[];
          for (var j = 0; j < deviceDetails.length; j++) {
            const id = deviceDetails[j].id;
            try {
              const response = await axios.get(
                `${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${name}&startTs=${startTs}&endTs=${endTs}&limit=10000&agg=NONE`,
                {
                  headers: { "X-Authorization": `Bearer ${token}` },
                }
              );

              // console.log(response.data)

              const telemetryData = response.data;

              const values = telemetryData[name] as TimeSeriesType[];

              // ***********Last Day Of Value*********
              var specificKeyData = values.map(function (tsValuePair) {
                return { x: tsValuePair.ts, y: tsValuePair.value };
              });
              var tsArr = specificKeyData.map((elem) => {
                var date = new Date(elem.x);
                var dateString = date
                  .toLocaleString()
                  .split(",")[0]
                  .replace(/\//g, "");
                return [dateString, elem.x, parseFloat(elem.y)];
              });
              // console.log(tsArr)
              var lastValuesMap = new Map();

              // Iterate over tsArr
              tsArr.forEach((subarr) => {
                var dateString = subarr[0];
                var date = new Date(subarr[1]);
                date.setSeconds(0, 0);
                date.setMinutes(0);
                var ts = date.getTime();
                var value = subarr[2];
                // Update the value for the current date string
                lastValuesMap.set(dateString, { ts: ts, value: value }); // Storing [ts, value] as the value
              });

              // Extract the last values for each date string
              specificKeyData = Array.from(lastValuesMap.values());

              // console.log("specificKeyData : ", name, specificKeyData);

              columnTs = jp.query(specificKeyData, "$..ts");
              const colValue = jp.query(
                specificKeyData,
                "$..value"
              ) as number[];
              if (columnsData.length > 0) {
                columnsData = colValue.map((value: number, i: number) =>
                  value
                    ? [columnTs[i], columnsData[i][1] + value]
                    : [columnTs[i], columnsData[i][1] + 0]
                );
              } else {
                columnsData = colValue.map((value: number, i: number) =>
                  value ? [columnTs[i], value] : [columnTs[i], 0]
                );
              }
              // console.log("columnsData: ", columnsData);

            } catch (error) {
              console.error(
                `Error fetching telemetry data for device ${id}:`,
                error
              );
            }
          }
          series.push({
            name: columnName[index],
            type: "column",
            data: columnsData,
          });
        };
      } else if(i==1) { // This is For Line
          const keys = Object.values(type)[i] as string;
          let lineData = [] as number[][];
          let lineTs = [] as number[];
          for(var j = 0; j < deviceDetails.length; j++) {
            const id = deviceDetails[j].id;
            try {
              const response = await axios.get(`${BASE_URL}/plugins/telemetry/DEVICE/${id}/values/timeseries?keys=${keys}&startTs=${startTs}&endTs=${endTs}&limit=10000&agg=NONE`, {
                headers: { 'X-Authorization': `Bearer ${token}` }
              });

              const telemetryData = response.data;
              const key = keys.split(",");
              
              for(const name of key) {
                const values = telemetryData[name] as TimeSeriesType[];
                // ***********Last Day Of Value*********
                var specificKeyData = values.map(function (tsValuePair) {
                  return { x: tsValuePair.ts, y: tsValuePair.value };
                });
                var tsArr = specificKeyData.map((elem) => {
                  var date = new Date(elem.x);
                  var dateString = date
                  .toLocaleString()
                  .split(",")[0]
                  .replace(/\//g, "");
                  return [dateString, elem.x, parseFloat(elem.y)];
                });
                // console.log(tsArr)
                var lastValuesMap = new Map();
                
                // Iterate over tsArr
                tsArr.forEach((subarr) => {
                  var dateString = subarr[0];
                  var date = new Date(subarr[1]);
                  date.setSeconds(0, 0);
                  date.setMinutes(0);
                  var ts = date.getTime();
                  var value = subarr[2];
                  // Update the value for the current date string
                  lastValuesMap.set(dateString, { ts: ts, value: value }); // Storing [ts, value] as the value
                });
                
                // Extract the last values for each date string
                specificKeyData = Array.from(lastValuesMap.values());
                // console.log(name ,specificKeyData)
                
                lineTs = jp.query(specificKeyData, "$..ts");
                const lineValue = jp.query(specificKeyData, "$..value");
                
                lineData.push(lineValue);
                
              }
              // console.log("lineData: ", lineData);
              
              let allPlantSumLineValue = [] as number[][];
              for(var j = 0; j < key.length; j++) {
                var temp = [] as number[];
                for(var k=0; k < lineData[j].length; k++) {
                  temp.push(
                    lineData[j][k] + lineData[j+key.length][k] //Summation Values by Plant
                  );
                }
                allPlantSumLineValue.push(temp);
              }
              
              // console.log("allPlantSumValue : ", allPlantSumLineValue);

              let splineData = [] as number[][];
              for(var z = 0; z < allPlantSumLineValue[0].length; z++) {

                var pv = ((allPlantSumLineValue[0][z]*100)/(allPlantSumLineValue[1][z]*allPlantSumLineValue[2][z]));
                var wind = allPlantSumLineValue[3][z]/(allPlantSumLineValue[4][z] * 24 * 0.2);
                var bess = (allPlantSumLineValue[5][z]/allPlantSumLineValue[6][z]) * 100;

                splineData.push(
                  [lineTs[z], (pv+wind+bess)/deviceDetails.length]
                )
              }
              series.push(
                {
                  name : lineName,
                  type : "spline",
                  data : splineData
                }
              )

            } catch (error) {
              console.error(
                `Error fetching telemetry data for device ${id}:`,
                error
              );
            }
          }
        }

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
