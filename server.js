//importing
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import cors from "cors";
import Messages from "./dbMessages.js";
import Rooms from "./dbRooms.js";

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1070508",
  key: "5b374abd250e29ae1de0",
  secret: "4d33d87dd55962d6536d",
  cluster: "eu",
  encrypted: true,
});

//middleware
app.use(express.json());

app.use(cors());

//DB config
const connection_url =
  "mongodb+srv://admin:zJLTRjPNP0EfUhOG@cluster0.jybie.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB is connected");

  const msgCollection = db.collection("rooms");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "update") {
      const messageDetails = Object.values(
        change.updateDescription.updatedFields
      );
      console.log(messageDetails);
      pusher.trigger("messages", "updated", {
        name: messageDetails[0].name,
        message: messageDetails[0].message,
        timestamp: messageDetails[0].timestamp,
        userId: messageDetails[0].userId,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

//????

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/rooms/sync", (req, res) => {
  Rooms.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/rooms/messages/new", (req, res) => {
  const dbMessage = req.body;

  Rooms.update(
    { _id: dbMessage._id },
    { $push: { messages: dbMessage.message } },
    (err, data) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send(data);
      }
    }
  );
});

app.post("/rooms/room/new", (req, res) => {
  const dbMessage = req.body;

  Rooms.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
