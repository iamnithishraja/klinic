import express from "express";
import { connectDatabse } from "./config/database";
import userRouter from "./routes/userRoutes";
import bodyParser from "body-parser";
const app = express();

connectDatabse();

app.use(bodyParser.json({ limit: "35mb" }));

app.get("/", (req, res) => {
  res.send("Hello chutiye");
});

app.use('/api/v1/', userRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});