import mongoose from "mongoose";

interface FailedNotificationAttrs {
  messageId: string;
  priority: number;
  message: string;
  date: Date;
}

interface FailedNotificationDoc extends mongoose.Document {
  messageId: string;
  priority: number;
  message: string;
  date: Date;
}

interface FailedNotificationModel
  extends mongoose.Model<FailedNotificationDoc> {
  build(attrs: FailedNotificationAttrs): FailedNotificationDoc;
}

const failedNotificationSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
    },
    priority: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    date: {
      type: mongoose.Schema.Types.Date,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

failedNotificationSchema.statics.build = (attrs: FailedNotificationAttrs) => {
  return new FailedNotification(attrs);
};

const FailedNotification = mongoose.model<
  FailedNotificationDoc,
  FailedNotificationModel
>("FailedNotification", failedNotificationSchema);

export { FailedNotification };
