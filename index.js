const express = require("express");
const cors = require("cors");
const app = express();
const env = require("dotenv");
const { Pool }= require("pg");

app.use(cors());
env.config();


const config = {
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(config);

// get method
app.get("/", async (req, res) => {
  try {
    const query = await pool.query("SELECT * FROM urls");
    if (query.rowCount === 0) {
      return res.json({Message: "No data recieved!!"});
    }
    res.json(query.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "NOT RECEIVING ANY DATA DUE TO SERVER ERROR!" });
  }
});

// Post method 
app.post("/", (req, res) => {
  pool.connect();
  // Delete this line after you've confirmed your server is running
  const newVideo = req.body;

  if (!newVideo.title || !newVideo.url) {
    res.send({ result: "failure", message: "Video could not be saved" });
  } else {
    const query =
      "INSERT INTO urls (title,url,rating) VALUES ($1, $2, $3) RETURNING id"; // notice how we returned id

    pool.query(query, [newVideo.title, newVideo.url, 0], (results) => {
      console.log(results.rows);
      res.status(200).send(results.rows[0]);
    });
    pool.release();
  }
});

// GET "/{id}"
app.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  pool
    .query("SELECT * FROM urls WHERE id=$1", [id])
    .then((result) => res.json(result.rows[0]))
    .catch((error) => {
      console.error(error);
      res.status(500).json(error);
    });
  // const filterVideo = videos.filter((vid) => vid.id === id);
  // filterVideo.length === 0
  //   ? res.send("Video not found")
  //   : res.json(filterVideo[0]);
});

// DELETE "/{id}"
app.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  console.log(typeof id);
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM urls WHERE id = $1", [id]);
    res.status(200).send(`Item with ID ${id} has been deleted`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting item");
  } finally {
    client.release();
  }
   
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
