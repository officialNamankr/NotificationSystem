import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendWhatsapp = async (to: string, body: string) => {
  await client.messages.create({
    body,
    from: process.env.TWILIO_FROM,
    to,
  });
};

export { sendWhatsapp };
