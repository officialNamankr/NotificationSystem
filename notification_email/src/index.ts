import mongoose from "mongoose";
// import { rabbitmqInstance } from "./rabbitmq-wrapper";
import { app } from "./app";
import { deadLetterConsumerInstance } from "./events/dead-letter-consumer";
import { emailConsumerInstance } from "./events/email-consumer";
import { rabbitmqInstance } from "@notify.com/notification_common";
// import { startConsumer } from "./events/email-consumer";
const start = async () => {
  console.log(process.env.RABBITMQ_URL);
  if (!process.env.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL must be defined");
  }
  //await rabbitmqInstance.connect();
  await emailConsumerInstance
    .connect()
    .then(async () => await emailConsumerInstance.consume());
  await deadLetterConsumerInstance
    .connect()
    .then(() => deadLetterConsumerInstance.consume());
  // await startConsumer();
  //await startConsumer();
  // try {
  //   await rabbitmqInstance.connect();
  //   console.log("Connected to RabbitMQ");
  // } catch (err) {
  //   console.error(err);
  // }
  // if (!process.env.JWT_KEY) {
  //   throw new Error("JWT_KEY must be defined");
  // }
  // if (!process.env.MONGO_URI) {
  //   throw new Error("MONGO_URI must be defined");
  // }
  try {
    console.log(process.env.MONGO_URI!);
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDb");
  } catch (err) {
    console.error(err);
  }
};

app.listen(3000, async () => {
  console.log("Listening on port 3000!!!!!!!!");
});

start();
