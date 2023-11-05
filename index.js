const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qtgfrql.mongodb.net/clothes?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const serviceCollection = client.db("Clothes").collection("Services");
        const BookingCollection = client.db("Clothes").collection("Booking"); // Renamed Bokking to Booking

        app.get("/Services", async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/Services/:id", async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        });

        app.post("/bookings", async (req, res) => {
            const bookingData = req.body;
            console.log(bookingData);

            const result = await BookingCollection.insertOne(bookingData);
            res.send(result);
        });

        app.get("/bookings", async (req, res) => {
            const cursor = BookingCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensure that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("ClothesLoop server is running");
});

app.listen(port, () => {
    console.log(`ClothesLoop server running on port: ${port}`);
});
