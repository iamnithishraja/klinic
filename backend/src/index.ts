import express from "express";
import { connectDatabse } from "./config/database";
import userRouter from "./routes/userRoutes";
import profileRouter from "./routes/profileRoutes";
import bodyParser from "body-parser";
const app = express();

connectDatabse();

app.use(bodyParser.json({ limit: "35mb" }));

// app.get("/", (req, res) => {
//   res.send("Hello chutiye");
// });


app.post("/api/v1/sendNotification", async (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Notification sent" });
});

app.use('/api/v1/', userRouter);
app.use('/api/v1/', profileRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});