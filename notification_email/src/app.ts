import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import cors from "cors";
//import { currentUserRouter } from "./routes/current-user";

import { errorHandler } from "@notify.com/notification_common";
import { NotFoundError } from "@notify.com/notification_common";
import { EmailRouter } from "./routes/send-mail";
import { getFailedMailsRouter } from "./routes/getFailedMails";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: true,
  })
);
app.use(cors());

app.use(EmailRouter);
app.use(getFailedMailsRouter);

app.all("*", async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
