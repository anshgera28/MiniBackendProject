const express = require("express");
const app = express();
const userModel = require("./models/user");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const postModel = require("./models/post");




app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());



app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/profile", isLogin, (req, res) => {
    console.log(req.user);
    res.render("login");
})


app.post("/register",async (req, res) => {
    let { name, username, password, email, age } = req.body;
   let user = await userModel.findOne({email});
   if(user) return res.status(500).send("User already exists");

   bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
        let user = await userModel.create({
            name,
            username,
            password: hash,
            email,
            age
        });
        let token = jwt.sign({
            email : email,
            userid: user._id
      },
      "shhhh");
      res.cookie("token", token);
      res.send("User registered successfully");
    });
   });
   
});

//login

app.post("/login",async (req, res) => {
    let { email, password } = req.body;
   let user = await userModel.findOne({email});
   if(!user) return res.status(500).send("something went wrong");
   bcrypt.compare(password, user.password, (err, result) => {
    if(!result) return res.status(500).send("something went wrong");
    let token = jwt.sign({
        email : email,
        userid: user._id
    },
    "shhhh");
    res.cookie("token", token);
    res.send("User logged in successfully");
   });
   
   
});

// logout

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

// middleware for protected routes

function isLogin(req, res, next) {
    if(req.cookies.token === "") return res.send("You are not logged in");
    else{
      let data =  jwt.verify(req.cookies.token, "shhhh");
      req.user = data;
      next();
    }
   
}




app.listen(3000); 