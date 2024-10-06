import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import Jwt from "jsonwebtoken";
import { User } from "../models/user";
import {
  BadRequestError,
  UserType,
  validateRequest,
} from "@notify.com/notification_common";

const router = express.Router();

router.post(
  "/api/users/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters"),
    body("role")
      .custom((value) => {
        if (!Object.values(UserType).includes(value)) {
          throw new BadRequestError("Invalid role value provided");
        }
        return true;
      })
      .withMessage("Invalid role value"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    console.log(email, password);
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError("Email in use");
    }

    const user = User.build({ email, password, role });
    await user.save();
    // Generate JWT
    const userJWT = Jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_KEY!
    );

    //Store it on the session object
    req.session = {
      jwt: userJWT,
    };

    res.status(201).send(user);
  }
);

export { router as signupRouter };
