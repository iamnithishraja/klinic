import express from "express";
import { connectDatabse } from "./config/database";
import userRouter from "./routes/userRoutes";
import profileRouter from "./routes/profileRoutes";
import bodyParser from "body-parser";
import searchRouter from "./routes/searchRoutes";
import cors from "cors";
import dotenv from "dotenv";
import appointmentRouter from "./routes/appoitmentRoutes";
dotenv.config();
const app = express();

connectDatabse();

app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "35mb" }));

// app.get("/", (req, res) => {
//   res.send("Hello chutiye");
// });

app.use('/api/v1/', userRouter);
app.use('/api/v1/', profileRouter);
app.use('/api/v1/', searchRouter);
app.use('/api/v1/', appointmentRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});