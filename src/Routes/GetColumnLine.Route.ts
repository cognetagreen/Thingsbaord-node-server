import express from "express"
import { GetColumnLineController } from "../Controller/GetColumnLine.Controller";

const GetColumnLineRouter = express.Router();

GetColumnLineRouter.post('/', GetColumnLineController);

export default GetColumnLineRouter;