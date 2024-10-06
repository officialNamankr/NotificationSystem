import express from "express";
import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import { validateRequest } from "@notify.com/notification_common";
import { User } from "../models/user";
import { BadRequestError } from "@notify.com/notification_common";
import { Password } from "../services/password";
import Jwt from "jsonwebtoken";
const router = express.Router();
router.post(
  "/api/users/signin",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("You must supply a password"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new BadRequestError("Invalid credentials");
    }
    const PassMatch = Password.compare(existingUser.password, password);
    if (!PassMatch) {
      throw new BadRequestError("Invalid credentials");
    }
    const userJWT = Jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );

    //Store it on the session object
    req.session = {
      jwt: userJWT,
    };

    res.status(200).send(existingUser);
  }
);

export { router as signinRouter };
