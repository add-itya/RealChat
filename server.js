//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js"
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1462798",
    key: "9f26de0c4377d7b5c894",
    secret: "cb4541665503c8b0bd54",
    cluster: "us2",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());



// DB config
const connection_url = "mongodb+srv://6194857:adi@cluster0.nxn7dio.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url);


// ???
const db = mongoose.connection;

db.once("open", () => {
    console.log("DB is connected");
    
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("change");

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.user,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
        } else {
            console.log("Error triggering pusher");
        }


    });
});

//api routes
app.get("/", (req, res) => res.status(200).send("Hello world"));

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})


app.post("/messages/new", (req, res) => {
    const dbMessage = req.body
    
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port, ()=>console.log("Listening on localhost: 9000"));