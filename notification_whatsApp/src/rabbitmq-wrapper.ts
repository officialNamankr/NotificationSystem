import amqp, { Channel, Connection } from "amqplib";
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
  public async sendToQueue(queueName: string, message: string): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(queueName, Buffer.from(message));
    console.log(`Sent message to queue: ${queueName}`);
  }
}

const rabbitmqInstance = new RabbitMQ(process.env.RABBITMQ_URL || "");

process.on("SIGINT", () => {
  rabbitmqInstance.close();
});

process.on("SIGTERM", () => {
  rabbitmqInstance.close();
});

export default rabbitmqInstance;
