// import { rabbitmqInstance } from "@notify.com/notification_common";
// import { queueGroupName } from "./enums";

// export const emailProducer = async (
//   to: string,
//   subject: string,
//   html: string
// ) => {
//   try {
//     await rabbitmqInstance.connect();
//     await rabbitmqInstance.sendToQueue(
//       queueGroupName,
//       JSON.stringify({
//         to,
//         subject,
//         html,
//       })
//     );
//   } catch (err) {
//     console.log(err);
//   }
// };
