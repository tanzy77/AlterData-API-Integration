const { faker, tr } = require('@faker-js/faker');
const mysql = require('mysql2');
const express = require("express");
const path = require("path");
const { connect } = require('http2');

const app = express();
app.use(express.urlencoded({extended: true}));
const methodOverride = require("method-override");
app.use(methodOverride("_method"));


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'delta_app',
  password: 'Enter Password'
});

let getRandomUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.username(),
    faker.internet.email(),
    faker.internet.password(),
  ]
};

let q = "INSERT INTO temp (id, username, email, password) VALUES ?";
let data = [];

for (let i = 1; i <= 100; i++) {
  data.push(getRandomUser());
}

try {
  connection.query(q, [data], (err, results) => {
    if (err) throw err;
    console.log(results);
  });  
} 
catch (err) {
  console.log(err);
}

console.log(getRandomUser());


app.get("/", (req, res) => {
  let q = "SELECT count(*) FROM temp";
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let count = result[0]['count(*)'];
      res.render("home.ejs", { count });
    })
  }
  catch(err) {
    console.log(err);
    res.send("Some error occured");
  }
});

app.get("/user", (req, res) => {
  let q = "SELECT id, username, email FROM temp";
  try {
    connection.query(q, (err, users) => {
      if (err) throw err;
      res.render("users.ejs", { users });
    })
  } catch(err) {
    res.send("error occured");
  }
});

//Edit UserName
app.get("/user/:id/edit", (req, res) => {
  let { id } = req.params;
  let q = `SELECT * FROM temp WHERE id = '${id}'`;

  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      res.render("edit.ejs", { user });
    })
  }
  catch(err) {
    console.log(err);
    res.send("Some error occured");
  }
});

//Update (DB)
app.patch("/user/:id", (req, res) => {
  let { id } = req.params;
  let { password : formPass, username : newUsername } = req.body;
  let q = `SELECT * FROM temp WHERE id = '${id}'`;

  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let user = result[0];
      
      if (formPass != user.password) {
        res.send("Incorrect password");
      }
      else {
        let q2 = `UPDATE temp SET username = '${ newUsername }' WHERE id = '${id}'`;
        connection.query(q2, (err, result) => {
          if (err) throw err;
          res.redirect("/user");
        });
      }
    });
  }
  catch(err) {
    console.log(err);
    res.send("Some error occured");
  }
});

//Add User
app.post("/user", (req, res) => {
  try {
    let id = getRandomUser()[0];
    let { username, email, password } = req.body;

    if (!id || !username || !email || !password) {
      return res.status(400).json({message: "All fields are required"});
    }
    
    let q3 = `INSERT INTO temp (id, username, email, password) VALUES (?, ?, ?, ?)`;

    connection.query(q3, [id, username, email, password], (err, result) => {
      if (err) {
        console.log("MYSQL Error", err);
        return res.status(500).send("Database Error");
      }
      console.log("User inserted: ", result);
      return res.redirect("/");
    });
  }
  catch (err) {
    res.send("Error Occured");
  }
})

app.get("/user/new", (req, res) => {
  res.render("add.ejs");
});

//Delete User
app.get("/user/:id/delete", (req, res) => {
  let { id } = req.params;
  let q5 = `SELECT * FROM temp WHERE id = ?`;

  connection.query(q5, [ id ], (err, result) => {
    if (err) {
      return res.send("Error Occured");
    }
    if (result.length === 0) return res.send("User not found");

    res.render("delete.ejs", { user: result[0] });
  });
})
app.delete("/user/:id", (req, res) => {
  try {
    let { id } = req.params;
    let {password : ogPassword } = req.body;
    let q4 = `SELECT * FROM temp WHERE id = ?`;

    connection.query(q4, [ id ],(err, result) => {
      if (err) throw err;
      let user = result[0];

      if (ogPassword != user.password) {
        return res.send("Access Denied");
      } 

      let q5 = `DELETE FROM temp WHERE id = '${id}'`;

      connection.query(q5, (err, result) => {
        if (err) {
          return res.send('Enable to delete user');
        }
        console.log("User deleted successfully");
        res.redirect("/user");
      });
    });
  }
  catch (err) {
    res.send("Error Occured");
  };
});


app.listen("8080", () => {
  console.log("Listening to server 8080");
})

// connection.end();