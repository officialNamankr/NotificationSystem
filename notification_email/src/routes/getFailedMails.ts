import mongoose from "mongoose";
import express, { Request, Response } from "express";
import { FailedNotification } from "../models/failed-notification";

const router = express.Router();

router.get(
  "/api/email/get-failed-mails",
  async (req: Request, res: Response) => {
    const failedNotifications = await FailedNotification.find({});
    res.send(failedNotifications);
  }
);

export { router as getFailedMailsRouter };
