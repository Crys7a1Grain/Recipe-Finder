const mariadb = require("mariadb/callback");
const express = require("express");
const fs = require("fs");

const pool = mariadb.createPool({
  host: "localhost",
  port: 3306,
  database: "recipes_finder",
  user: "root",
  password: "bitnamiwamp"
});

const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query("SELECT * FROM ingredients", (err, results) => {
      const ingredients = results;
      connection.release(); // освободить соединение обратно в пул
      if (err) throw err;
      connection.query(
        "SELECT * FROM ingredient_categories",
        (err, results) => {
          const categories = results;
          if (err) throw err;
          res.render("index.ejs", {
            ingredients: ingredients,
            categories: categories,
          });
        }
      );
    });
  });
});

app.post("/search", (req, res) => {
  console.log("req.body.ingredients = " + req.body.ingredients);
  const ingredients = req.body.ingredients.toString().split(",").map(Number);
  console.log("ingredients = " + ingredients);
  const sql = fs.readFileSync("query.sql", "utf8");
  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(sql, [ingredients], (err, results) => {
      const id_recipes = results.map((row) => row.id);
      connection.release(); // освободить соединение обратно в пул
      if (err) throw err;
      const sql = `SELECT name, description, image FROM recipes WHERE id IN (?)`;
      connection.query(sql, [id_recipes], (err, results) => {
        const recipes = results.map((row) => {
          const image = row.image.toString('base64');
          return {
            name: row.name,
            description: row.description,
            image: image
          };
        });
        connection.release(); // освободить соединение обратно в пул
        if (err) throw err;
        console.log(recipes);
        res.json(recipes); //res.send(JSON.stringify(recipes));
      });
    });
  });
});

// app.get('/', (req, res) => {
//   pool.getConnection((err, connection) => {
//     if (err) throw err;
//     connection.query('SELECT * FROM ingredients', (err, results) => {
//       const ingredients = results;
//       connection.release(); // освободить соединение обратно в пул
//       if (err) throw err;
//       connection.query('SELECT * FROM ingredient_categories', (err, results) => {
//         const categories = results;
//         if (err) throw err;
//         connection.release(); // освободить соединение обратно в пул
//         res.render('index.ejs', { ingredients: ingredients, categories: categories });
//       });
//     });
//   });
// });

// app.get('/search', (req, res) => {
//   const ingredients = req.query.ingredients.split(',');
//   //const ingredients = req.query.ingredients;
//   //console.log(ingredients);

//   const sql = fs.readFileSync('query.sql', 'utf8');
//   //console.log(sql); // вывод содержимого файла в консоль

//   pool.getConnection((err, connection) => {
//     if (err) throw err;
//     connection.query(sql, [ingredients], (err, results) => {
//       const id_recipes = results.map(row => row.id);
//       console.log(id_recipes);
//       connection.release(); // освободить соединение обратно в пул
//       if (err) throw err;
//       const sql = `SELECT name FROM recipes WHERE id IN (?)`;
//       connection.query(sql, [id_recipes], (err, results) => {
//         connection.release(); // освободить соединение обратно в пул
//         if (err) throw err;
//         res.render('search.ejs', { recipes: results});
//       });
//     });
//   });
// });

// app.get('/recipes', (req, res) => {
//   pool.getConnection((err, connection) => {
//     if (err) throw err;
//     connection.query('SELECT * FROM recipes', (err, results) => {
//       connection.release(); // освободить соединение обратно в пул
//       if (err) throw err;
//       res.render('recipes', { recipes: results });
//     });
//   });
// });

// app.get('/recipe/:id', async (req, res) => {
//   const id = req.params.id;
//   const conn = await pool.getConnection();
//   const rows = await conn.query(`SELECT * FROM recipes WHERE id=${id}`);
//   conn.release();
//   res.render('recipe', { recipe: rows[0] });
// });

app.listen(8080, () => {
  console.log("Server started on port 8080");
});