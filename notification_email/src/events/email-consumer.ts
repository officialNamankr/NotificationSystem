import amqp from "amqplib";
import { sendMail } from "../services/email-provider";
import { EmailEnums } from "./enums";
import { exchangeName } from "@notify.com/notification_common";

class EmailConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private maxRetries = 5; // Define the max number of retries

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
      this.channel = await this.connection.createChannel();
      console.log("1");
      await this.channel.assertExchange(
        EmailEnums.DEAD_LETTER_EXCHANGE,
        "direct",
        {
          durable: true,
        }
      );
      console.log("2");
      // Declare the main email queue with DLX (Dead-letter exchange) binding
      await this.channel.assertQueue(EmailEnums.EMAIL_QUEUE, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": EmailEnums.DEAD_LETTER_EXCHANGE,
          "x-dead-letter-routing-key": EmailEnums.DEAD_LETTER_ROUTING_KEY, // Dead letter routing key
          "x-message-ttl": 60000, // Retry delay (in ms), set to 60s
        },
      });
      console.log("Email Consumer connected 1");
      // Declare the dead-letter queue for failed email attempts
      await this.channel.assertQueue(EmailEnums.FAILED_EMAIL_QUEUE, {
        durable: true,
      });
      console.log("Email Consumer connected 2");
      // Bind the dead-letter queue to a dead-letter exchange
      await this.channel.bindQueue(
        EmailEnums.FAILED_EMAIL_QUEUE,
        EmailEnums.DEAD_LETTER_EXCHANGE,
        EmailEnums.DEAD_LETTER_ROUTING_KEY
      );
      console.log("Email Consumer connected 3");
      await this.channel.assertExchange(exchangeName, "direct", {
        durable: true,
      });

      // Bind the main email queue to the notification exchange with the routing key 'email'
      await this.channel.bindQueue(
        EmailEnums.EMAIL_QUEUE,
        exchangeName,
        EmailEnums.EMAIL_QUEUE
      );
      console.log("Email Consumer connected 4");
    } catch (err) {
      console.error("Failed to connect ot RabbitMQ Email Consumer:", err);
      setTimeout(() => {
        this.connect();
      }, 5000);
    }
  }

  async consume() {
    if (!this.channel) throw new Error("Channel is not initialized");
    console.log("Waiting for messages in email-queue");

    this.channel.consume(
      EmailEnums.EMAIL_QUEUE,
      async (msg) => {
        if (msg) {
          const { to, subject, html } = JSON.parse(msg.content.toString());
          // const retryCount = msg.properties.headers["x-retry-count"] || 0;
          const retryCount =
            msg.properties && msg.properties.headers
              ? msg.properties.headers["x-retry-count"] || 0
              : 0;

          try {
            await sendMail(to, subject, html); // Logic to send email
            console.log("Email sent successfully");
            //this.channel!.ack(msg);
          } catch (error) {
            console.error("Failed to send email", error);

            if (retryCount < this.maxRetries) {
              console.log(`Retrying... (${retryCount + 1})`);
              this.channel!.nack(msg, false, false); // Requeue the message
              this.channel!.sendToQueue("email-queue", msg.content, {
                headers: {
                  "x-retry-count": retryCount + 1, // Increment retry count
                },
                persistent: true,
              });
            } else {
              console.error(`Max retries reached. Sending message to DLX.`);
              this.channel!.nack(msg, false, false); // Send to dead-letter queue
            }
          }
        }
      },
      {
        noAck: false,
      }
    );
  }
}

export const emailConsumerInstance = new EmailConsumer();

// import { rabbitmqInstance } from "@notify.com/notification_common";
// import { queueGroupName } from "./queue-name";
// import { sendMail } from "../services/email-provider";
// const consumeEmail = async () => {
//   console.log("Email consumer started");
//   try {
//     await rabbitmqInstance.connect();
//     await rabbitmqInstance.consumeQueue(queueGroupName, async (msg) => {
//       console.log("Message received:", msg?.content.toString());
//       if (msg) {
//         const { to, subject, html } = JSON.parse(msg.content.toString());
//         try {
//           await sendMail(to, subject, html);
//           console.log("Email sent successfully");
//         } catch (err) {
//           console.log(err);
//         }
//       } else {
//         console.log("No message received");
//       }
//     });
//   } catch (err) {
//     console.log(err);
//   }
// };

// export const startConsumer = async () => {
//   try {
//     console.log("Starting consumer");

//     await consumeEmail();
//   } catch (error) {
//     console.error("Error starting consumer:", error);
//   }
// };
