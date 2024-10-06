import express, { Request, Response } from "express";
import { BadRequestError } from "@notify.com/notification_common";
import { rabbitmqInstance } from "../rabbitmq-wrapper";
import { EmailEnums } from "../events/enums";
const router = express.Router();

router.post("/api/email/send-mail", async (req: Request, res: Response) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    throw new BadRequestError("All fields are required");
  }
  await rabbitmqInstance.connect();
  await rabbitmqInstance.publishMessage(EmailEnums.EMAIL_QUEUE, {
    to,
    subject,
    html,
  });
  res.status(200).send({
    message: "Email sent to queue  successfully",
  });
});

export { router as EmailRouter };
