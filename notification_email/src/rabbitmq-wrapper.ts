import amqp, { Channel, Connection } from "amqplib";
import { exchangeName } from "./events/types/exchange";
class RabbitMQ {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly rabbitmqUrl: string = process.env.RABBITMQ_URL || "";
  constructor(rabbitmqUrl: string) {
    this.rabbitmqUrl = rabbitmqUrl;
  }

  public async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.connection.on("error", (err) => {
        console.error("Error establishing connection:", err.message);
        this.reconnect();
      });
      this.connection.on("close", () => {
        console.error("Connection closed, attempting to reconnect");
        this.reconnect();
      });
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(exchangeName, "direct", {
        durable: true,
      });
      console.log("Connected to RabbitMQ");
    } catch (err) {
      console.error("Failed to connect ot RabbitMQ:", err);
      setTimeout(() => {
        this.connect();
      }, 5000);
    }
  }

  private async reconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    this.connection = null;
    this.channel = null;
    console.log("Reconnecting to RabbitMQ");
    await this.connect();
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }

      console.log("Disconnected from RabbitMQ");
    } catch (error) {
      console.error("Failed to disconnect from RabbitMQ:", error);
    }
  }

  public async publishMessage(routingKey: string, message: any) {
    if (!this.channel) throw new Error("Channel is not initialized");
    this.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log(`Message sent to ${routingKey}`);
  }

  // public async sendToQueue(queueName: string, message: string): Promise<void> {
  //   if (!this.channel) {
  //     throw new Error("Channel not initialized");
  //   }
  //   await this.channel.assertQueue(queueName, { durable: true });
  //   this.channel.sendToQueue(queueName, Buffer.from(message));
  //   console.log(`Sent message to queue: ${queueName}`);
  // }

  // public async consumeQueue(
  //   queue: string,
  //   callback: (msg: amqp.ConsumeMessage | null) => void
  // ): Promise<void> {
  //   if (!this.channel) {
  //     throw new Error("RabbitMQ channel is not available");
  //   }
  //   await this.channel.assertQueue(queue, { durable: true });
  //   console.log(`Waiting for messages in queue: ${queue}`);

  //   this.channel.consume(
  //     queue,
  //     (msg: amqp.ConsumeMessage | null) => {
  //       if (msg !== null) {
  //         console.log(`Received message: ${msg.content.toString()}`);
  //         callback(msg);
  //         //this.channel!.ack(msg); // Acknowledge that the message was processed successfully
  //       } else {
  //         console.log("No message received");
  //       }
  //     },
  //     {
  //       noAck: true,
  //     }
  //   );
  // }
}

const rabbitmqInstance = new RabbitMQ(process.env.RABBITMQ_URL || "");

process.on("SIGINT", () => {
  rabbitmqInstance.close();
});

process.on("SIGTERM", () => {
  rabbitmqInstance.close();
});

export { rabbitmqInstance };

// import amqp, { Channel, Connection } from "amqplib";
// class RabbitMQ {
//   private connection: Connection | null = null;
//   private channel: Channel | null = null;
//   private readonly rabbitmqUrl: string = process.env.RABBITMQ_URL || "";
//   constructor(rabbitmqUrl: string) {
//     this.rabbitmqUrl = rabbitmqUrl;
//   }

//   public async connect(): Promise<void> {
//     try {
//       this.connection = await amqp.connect(this.rabbitmqUrl);
//       this.connection.on("error", (err) => {
//         console.error("Error establishing connection:", err.message);
//         this.reconnect();
//       });
//       this.connection.on("close", () => {
//         console.error("Connection closed, attempting to reconnect");
//         this.reconnect();
//       });
//       this.channel = await this.connection.createChannel();
//       console.log("Connected to RabbitMQ");
//     } catch (err) {
//       console.error("Failed to connect ot RabbitMQ:", err);
//       setTimeout(() => {
//         this.connect();
//       }, 5000);
//     }
//   }

//   private async reconnect(): Promise<void> {
//     if (this.channel) {
//       await this.channel.close();
//     }
//     this.connection = null;
//     this.channel = null;
//     console.log("Reconnecting to RabbitMQ");
//     await this.connect();
//   }

//   public async close(): Promise<void> {
//     try {
//       if (this.channel) {
//         await this.channel.close();
//       }
//       if (this.connection) {
//         await this.connection.close();
//       }
//       console.log("Disconnected from RabbitMQ");
//     } catch (error) {
//       console.error("Failed to disconnect from RabbitMQ:", error);
//     }
//   }
//   public async sendToQueue(queueName: string, message: string): Promise<void> {
//     if (!this.channel) {
//       throw new Error("Channel not initialized");
//     }
//     await this.channel.assertQueue(queueName, { durable: true });
//     this.channel.sendToQueue(queueName, Buffer.from(message));
//     console.log(`Sent message to queue: ${queueName}`);
//   }

//   public async consumeQueue(
//     queue: string,
//     callback: (msg: amqp.ConsumeMessage | null) => void
//   ): Promise<void> {
//     if (!this.channel) {
//       throw new Error("RabbitMQ channel is not available");
//     }
//     await this.channel.assertQueue(queue, { durable: true });
//     console.log(`Waiting for messages in queue: ${queue}`);

//     this.channel.consume(
//       queue,
//       (msg: amqp.ConsumeMessage | null) => {
//         if (msg !== null) {
//           console.log(`Received message: ${msg.content.toString()}`);
//           callback(msg);
//           //this.channel!.ack(msg); // Acknowledge that the message was processed successfully
//         } else {
//           console.log("No message received");
//         }
//       },
//       {
//         noAck: true,
//       }
//     );
//   }
// }

// const rabbitmqInstance = new RabbitMQ(process.env.RABBITMQ_URL || "");

// process.on("SIGINT", () => {
//   rabbitmqInstance.close();
// });

// process.on("SIGTERM", () => {
//   rabbitmqInstance.close();
// });

// export { rabbitmqInstance };
