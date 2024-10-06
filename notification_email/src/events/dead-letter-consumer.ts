import amqp from "amqplib";
import { EmailEnums } from "./enums";
import { FailedNotification } from "../models/failed-notification";
class DeadLetterConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(EmailEnums.FAILED_EMAIL_QUEUE, {
      durable: true,
    });
    console.log("Dead-letter Consumer connected");
  }

  async consume() {
    if (!this.channel) throw new Error("Channel is not initialized");
    console.log("Waiting for failed messages in failed-email-queue");

    this.channel.consume(
      EmailEnums.FAILED_EMAIL_QUEUE,
      async (msg: amqp.ConsumeMessage | null) => {
        if (msg) {
          const messageData = JSON.parse(msg.content.toString());
          console.error(
            `Failed message received: ${JSON.stringify(
              messageData
            )}\n AckMsg: ${JSON.stringify(msg)}`
          );

          let priority = messageData.priority || "0";
          let messageId = messageData.messageId || "aasdfasf";
          let message = messageData.message || "message";
          let date = new Date();

          const failedNotification = FailedNotification.build({
            messageId: messageId,
            priority: priority,
            message: message,
            date: date,
          });
          await failedNotification.save();

          // Save to database or make necessary action for failed message
          // Example: await saveToFailedMessageDB(messageData);

          this.channel!.ack(msg);
        }
      }
    );
  }
}

export const deadLetterConsumerInstance = new DeadLetterConsumer();
