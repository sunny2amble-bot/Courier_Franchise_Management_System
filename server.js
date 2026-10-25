const db = require("./db");
const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.get("/api/customers", (req, res) => {
    db.query("SELECT * FROM customers", (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Failed to fetch customers"
            });
        }

        res.json({
            success: true,
            customers: results
        });
    });
});
// Register Customer
app.post("/api/customers", (req, res) => {
    const { full_name, phone, address } = req.body;

    if (!full_name || !phone || !address) {
        return res.status(400).json({
            success: false,
            message: "All customer fields are required"
        });
    }

    const sql = "INSERT INTO customers (full_name, phone, address) VALUES (?, ?, ?)";

    db.query(sql, [full_name, phone, address], (err, result) => {
        if (err) {
            console.error("Customer registration error:", err.message);
            return res.status(500).json({
                success: false,
                message: "Failed to register customer"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer_id: result.insertId
        });
    });
});
// Login API
app.post("/api/login", (req, res) => {
    const { email, password, role } = req.body;
    console.log("Login received:", email, role);

    if (!email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: "Email, password and role are required"
        });
    }
        const sql = `
        SELECT user_id, email, password, role
        FROM users
        WHERE email = ? AND role = ?
    `;

    db.query(sql, [email, role], (err, results) => {
        if (err) {
            console.error("Login error:", err.message);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0 || results[0].password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email, password or role"
            });
        }

        return res.json({
            success: true,
            message: "Login successful"
        });
    });});

app.get("/api/parcels", (req, res) => {
    const sql = "SELECT * FROM parcels ORDER BY parcel_id DESC";


    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch parcels error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch parcels"
            });
        }

        res.json({
            success: true,
            parcels: results
        });
    });
});
app.post("/api/parcels", (req, res) => {
    const { sender_id, receiver_name, receiver_phone, receiver_address, weight } = req.body;

    if (!sender_id || !receiver_name || !receiver_phone || !receiver_address || !weight) {
        return res.status(400).json({
            success: false,
            message: "Please fill all parcel fields."
        });
    }

    const tracking_id = "CR" + Date.now();

    const sql = `
        INSERT INTO parcels
        (tracking_id, sender_id, receiver_name, receiver_phone, receiver_address, weight, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [tracking_id, sender_id, receiver_name, receiver_phone, receiver_address, weight, "Booked"],
        (err, result) => {
            if (err) {
                console.error("Parcel booking error:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Failed to book parcel: " + err.message
                });
            }

            return res.status(201).json({
                success: true,
                message: "Parcel booked successfully",
                tracking_id
            });
        }
    );
});
app.get("/api/parcels/:tracking_id", (req, res) => {
    const trackingId = req.params.tracking_id;

    const sql = "SELECT * FROM parcels WHERE tracking_id = ?";

    
   db.query(sql, [trackingId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Parcel not found. Please check the Tracking ID."
            });
        }

        res.json({
            parcel: results[0]
        });
    });
});
app.put("/api/parcels/:tracking_id/status", (req, res) => {
    const trackingId = req.params.tracking_id;
    const { status } = req.body;

    const allowedStatuses = [
        "Booked",
        "In Transit",
        "Out for Delivery",
        "Delivered"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid parcel status."
        });
    }

    const sql = "UPDATE parcels SET status = ? WHERE tracking_id = ?";

    db.query(sql, [status, trackingId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Database error."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Parcel not found. Check the Tracking ID."
            });
        }

        res.json({
            message: "Parcel status updated successfully to " + status + "."
        });
    });
});
app.post("/api/delivery-agents", (req, res) => {
    const { name, phone, address, availability } = req.body;

    if (!name || !phone || !address || !availability) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields."
        });
    }

    const sql = `
        INSERT INTO delivery_agents
        (agent_name, phone, city, availability)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, phone, address, availability],
        (err, result) => {
            if (err) {
                console.error("Delivery agent registration error:", err.message);
                return res.status(500).json({
                    success: false,
                    message: "Failed to register delivery agent."
                });
            }

            res.status(201).json({
                success: true,
                message: "Delivery agent registered successfully."
            });
        }
    );
});

app.post("/api/delivery-agents", (req, res) => {
    const { name, phone, address, availability } = req.body;

    if (!name || !phone || !address || !availability) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields."
        });
    }

    const sql = `
        INSERT INTO delivery_agents
        (agent_name, phone, city, availability)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, phone, address, availability],
        (err, result) => {
            if (err) {
                console.error("Delivery agent registration error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to register delivery agent."
                });
            }

            res.status(201).json({
                success: true,
                message: "Delivery agent registered successfully."
            });
        }
    );
});

app.get("/api/hubs", (req, res) => {
    const sql = `
        SELECT hub_id, hub_name, city, address
        FROM hubs
        ORDER BY hub_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error loading hubs:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to load hubs."
            });
        }

        res.json({
            success: true,
            hubs: results
        });
    });
});
app.post("/api/hubs", (req, res) => {
    const { hub_name, city, address, phone } = req.body;

    if (!hub_name || !city || !address || !phone) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields."
        });
    }

    const sql = `
        INSERT INTO hubs (hub_name, city, address, phone)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [hub_name, city, address, phone], (err, result) => {
        if (err) {
            console.error("Hub registration error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to register hub."
            });
        }

        res.status(201).json({
            success: true,
            message: "Hub registered successfully."
        });
    });
});

app.get("/api/delivery-agents", (req, res) => {
    const sql = `
        SELECT agent_id, agent_name, phone, city, availability
        FROM delivery_agents
        ORDER BY agent_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error loading delivery agents:", err.message);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            agents: results
        });
    });
});

app.get("/api/cod-payments/columns", (req, res) => {
    db.query("DESCRIBE cod_payments", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            columns: results.map(column => column.Field)
        });
    });
});
app.post("/api/cod-payments", (req, res) => {
    const { tracking_id, amount, payment_status, remarks } = req.body;
    console.log("COD Tracking ID received:", tracking_id);
    
        const parcelSql = `
                   SELECT parcel_id
                   FROM parcels
                   WHERE TRIM(tracking_id) = TRIM(?)
                `;
    db.query(parcelSql, [tracking_id], (err, parcels) => {
        if (err) {
                return res.status(500).json({
                success: false,
                message: "Database error while finding parcel."
            });
        }

        if (parcels.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Tracking ID not found."
            });
        }

        const insertSql =`
              INSERT INTO cod_payments
              (parcel_id, amount, payment_status, remarks)
              VALUES (?, ?, ?, ?)
              `;

        db.query(
            insertSql,
            [parcels[0].parcel_id, amount, payment_status, remarks],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({
                    success: true,
                    message: "COD payment saved successfully!",
                    payment_id: result.insertId
                });
            }
        );
    });
});
app.get("/api/cod-payments", (req, res) => {
    const sql = `
        SELECT payment_id, parcel_id, amount,
               payment_status, payment_date, remarks
        FROM cod_payments
        ORDER BY payment_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            payments: results
        });
    });
});
app.get("/api/parcels/columns", (req, res) => {
    db.query("DESCRIBE parcels", (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            columns: results.map(column => column.Field)
        });
    });
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});