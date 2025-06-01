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

// profile route
app.get("/profile", isLogin, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    await user.populate("posts");
    res.render("profile", {user});
})

// like 
app.get("/like/:id", isLogin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");


    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect("/profile");
})

// edit

app.get("/edit/:id", isLogin, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    res.render("edit", {post});
})

app.post("/post", isLogin, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    let{content} = req.body;
     let post = await postModel.create({
       userId: user._id,
       content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

// update

app.post("/update/:id", isLogin, async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect("/profile");
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
   if(!user) return res.status(500).send("User not found");
    
   bcrypt.compare(password, user.password, (err, result) => {
    if(result){
        let token = jwt.sign({
            email : email,
            userid: user._id
        },
        "shhhh");
        res.cookie("token", token);
        res.status(200).redirect("/profile");
    }else{
        res.redirect("/login");
    }
   });   
   
});

// logout

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

// middleware for protected routes

function isLogin(req, res, next) {
    if(req.cookies.token === "") return res.redirect("/login");
    else{
      let data =  jwt.verify(req.cookies.token, "shhhh");
      req.user = data;
      next();
    }
   
}




app.listen(3000); 