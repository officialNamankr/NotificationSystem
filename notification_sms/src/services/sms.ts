import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = Twilio(accountSid, authToken);

const sendSMS = async (to: string, body: string) => {
  await client.messages.create({
    body,
    from: process.env.TWILIO_FROM,
    to,
  });
};

export { sendSMS };
