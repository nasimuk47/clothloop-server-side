const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
    cors({
        origin: [
            "http://localhost:5173",

            "https://clothloop-auth.web.app",
            " https://clothloop-auth.firebaseapp.com",
        ],

        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

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
        // await client.connect();

        const serviceCollection = client.db("Clothes").collection("Services");
        const BookingCollection = client.db("Clothes").collection("Booking"); // Renamed Bokking to Booking

        // AuthReleted api

        app.post("/jwt", async (req, res) => {
            const user = req.body;
            console.log("user for token", user);

            const token = jwt.sign(user, process.env.SECRET, {
                expiresIn: "1h",
            });
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
            });
            res.send({ success: true });
        });

        app.post("/logout", async (req, res) => {
            const user = req.body;

            console.log("logged out", user);
            res.clearCookie("token", { maxAge: 0 }).send({ success: true });
        });

        // middlewere

        const logger = (req, res, next) => {
            console.log("log:info", req.method, req.url);
            next();
        };
        const verifyToken = (req, res, next) => {
            const token = req.header("Authorization");
            console.log("Token in the middleware:", token);

            if (!token) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            try {
                const decoded = jwt.verify(token, process.env.SECRET);
                req.user = decoded;
                next();
            } catch (error) {
                return res.status(401).json({ message: "Token is not valid" });
            }
        };

        // services related api
        app.get("/Services", async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        //  single service deitais ---------------------
        app.get("/Services/:id", async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        });

        // my booking  start--------------
        app.post("/bookings", async (req, res) => {
            const bookingData = req.body;
            console.log(bookingData);

            const result = await BookingCollection.insertOne(bookingData);
            res.send(result);
        });

        app.get("/bookings", verifyToken, async (req, res) => {
            const cursor = BookingCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // my booking done-----------------

        // add new service-----------------

        app.post("/services", async (req, res) => {
            const newService = req.body;
            console.log(newService);

            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        });

        // add new service done ----------------

        // Delete card  from bookings --------------

        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            try {
                const result = await BookingCollection.deleteOne({
                    _id: new ObjectId(id),
                });
                if (result.deletedCount > 0) {
                    res.json({ deletedCount: result.deletedCount });
                } else {
                    res.status(404).json({ deletedCount: 0 });
                }
            } catch (error) {
                console.error("Error deleting service:", error);
                res.status(500).json({ deletedCount: 0 });
            }
        });

        // deleted action done -------------------

        // Get a single booking by ID

        app.get("/bookings/:id", async (req, res) => {
            const id = req.params.id;

            try {
                console.log(id);

                const query = { _id: new ObjectId(id) };
                const result = await BookingCollection.findOne(query);

                if (result) {
                    console.log(result);
                    res.json(result);
                } else {
                    console.log(id);
                    res.status(404).json({ message: "Booking not found" });
                }
            } catch (error) {
                console.error(error);

                res.status(500).json({ message: "Internal Server Error" });
            }
        });

        // done---------------

        // Update a booking by ID
        app.put("/bookings/:id", async (req, res) => {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid booking ID" });
            }

            const updatedData = req.body;

            try {
                const result = await BookingCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );

                if (result.modifiedCount > 0) {
                    res.json({ message: "Booking updated successfully" });
                } else {
                    res.status(404).json({ message: "Booking not found" });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });

        // ...

        // Update a booking status by ID
        app.put("/bookings/:id/status", async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid booking ID" });
            }

            try {
                const query = { _id: new ObjectId(id) };
                const updatedData = { $set: { status: status } };

                const result = await BookingCollection.updateOne(
                    query,
                    updatedData
                );

                if (result.modifiedCount > 0) {
                    res.json({
                        message: "Booking status updated successfully",
                    });
                } else {
                    res.status(404).json({ message: "Booking not found" });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal Server Error" });
            }
        });

        // ...

        // Update service done -----------------------------------------------------------

        // await client.db("admin").command({ ping: 1 });
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
