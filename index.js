import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "123456",
  port: 5432,
});
db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [
  { id: 1, title: "Buy milk" },
  { id: 2, title: "Finish homework" },
];


async function checkItems() {
  const result = await db.query("SELECT * FROM items");
  ///replaces items array everytime, no duplicates , now it is fresh all of the time
  items = result.rows.map(row => ({  /// used to transform each row into an object with id and title properties.(map operation)
    id: row.id,
    title: row.title,
  }));

  return items;
}


app.get("/", async (req, res) => {

  const newItems = await checkItems();

  res.render("index.ejs", {
    listTitle: "Today",
    listItems: newItems,
  });
});

app.post("/add", async (req, res) => {
  const newItemTitle = req.body.newItem;

  try {
    // Use RETURNING to get the values of the inserted row
    const result = await db.query(
      "INSERT INTO items (title) VALUES ($1) RETURNING *",
      [newItemTitle]
    );
    console.log(result.rows[0].id);
    const newItem = {
      id: result.rows[0].id,
      title: result.rows[0].title,
    };
    
    items.push(newItem);

    res.redirect("/");
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/edit", async (req, res) => {
  const newTitle = req.body.updatedItemTitle;
  const newId = req.body.updatedItemId;

  try {
   const result = await db.query(
     "UPDATE items SET title = $1 WHERE id = $2 RETURNING *;",
     [newTitle, newId]
   );

   const updatedItem = {
     id: result.rows[0].id,
     title: result.rows[0].title,
   };

   // Find the index of the item with the matching id in the local 'items' array
   const index = items.findIndex(item => item.id === updatedItem.id);

   // If the item is found, update it
   if (index !== -1) {
     items[index] = updatedItem;
   }

   res.redirect("/");
 } catch (error) {
   console.error("Error updating item:", error);
   res.status(500).send("Internal Server Error");
 }
});


app.post("/delete", async (req, res) => {

  const deleteId = req.body.deleteItemId;

  try {
    const result = await db.query("DELETE FROM items WHERE id = $1", [deleteId]);
 
   
 
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).send("Internal Server Error");
  }

});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
