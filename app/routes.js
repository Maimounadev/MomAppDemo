const { result } = require("lodash");
const { ObjectId } = require("mongodb");
// Set environment variables for your credentials: PUT THESE SECRETS IN A .ENV FILE BEFORE PUSHING
const accountSid = "AC2378d3d252c198052c00a4d3bafd6d38";
const authToken = "646c251363ef5ad393f95e4d5a0e8681";
const client = require("twilio")(accountSid, authToken);
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { captureRejectionSymbol } = require("events");
const stripe = require("stripe")(process.env.SECRET_KEY);
// delete fs if test fails
require("dotenv").config();
// test =======

module.exports = function (app, passport, db, multer) {
  // Image Upload Code =========================================================================
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/images/uploads");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  });

  const upload = multer({ storage: storage });

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  // starter api for my marketplace feature, users can buy and sell products. (more work to be done during the week, i also still have to work on the login page.)
  app.get("/", function (req, res) {
    res.render("signup.ejs");
  });

  app.get("/marketplace", isLoggedIn, function (req, res) {
    let boughtItems = [];
    let filter = req.query.price
      ? { price: parseInt(req.query.price) }
      : undefined;
    db.collection("marketplace")
      .find(filter)
      .toArray((err, items) => {
        db.collection("purchased")
          .find()
          .toArray((err, result) => {
            if (err) return console.log(err);
            for (let i = 0; i < result.length; i++) {
              boughtItems.push(result[i].item[0]._id);
            }
            res.render("marketplace.ejs", {
              user: req.user.local.email,
              items,
              result,
              boughtItems: boughtItems,
              myAddress: req.user.local.address,
            });
          });
      });
  });

  app.post("/sell", isLoggedIn, upload.single("file-to-upload"), (req, res) => {
    const { title, price, address, description, condition, age } = req.body;
    db.collection("marketplace").save(
      {
        isAvailabale: true,
        buyer: "noBody",
        title,
        price: Number(price),
        address,
        seller: req.user.local.email,
        description,
        age,
        condition,
        imgPath: "images/uploads/" + req.file.filename,
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");
        res.redirect("/marketplace");
      }
    );
  });

  // test =================


  app.put('/edit', (req, res) => {
    console.log(req.body)
    db.collection('marketplace').findOneAndUpdate({ _id: ObjectId(req.body.id) },
   {
    $set: {
      msg: req.body.newText
    }
  }, {
    sort: {_id: -1},
    upsert: true
  }, (err, result) => {
    if (err) return res.send(err)
    res.send(result)
  })
})


  // stripe
  app.get("/cancel", isLoggedIn, function (req, res) {
    db.collection("messages")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        const isNewMom = req.user.local.momType == "first-time-mom";
        // if (isNewMom) {
        //   res.render('newMomProfile.ejs')
        // }
        // else{
        res.render("cancel.ejs", {
          user: req.user.local,
          messages: result,
        });
        // }
      });
  });

// post for checkout

app.post("/success", isLoggedIn, upload.single("file-to-upload"), (req, res) => {
  const { title, price, address, description, condition, age } = req.body;
  db.collection("marketplace").save(
    {
      isAvailabale: true,
      buyer: "noBody",
      title,
      price: Number(price),
      address,
      seller: req.user.local.email,
      description,
      age,
      condition,
      imgPath: "images/uploads/" + req.file.filename,
    },
    (err, result) => {
      if (err) return console.log(err);
      console.log("saved to database");
      res.redirect("/success.ejs");
    }
  );
});


  // stripe

  


  app.get("/listings", isLoggedIn, function (req, res) {
    db.collection("marketplace")
      .find({ seller: req.user.local.email })
      .toArray((err, data) => {
        console.log(data);
        if (err) return console.log(err);
        db.collection("purchased")
          .find()
          .toArray((err, result) => {
            if (err) return console.log(err);
            res.render("purchasedTwo.ejs", {
              data,
              result,
              myAddress: req.user.local.address,
            });
          });
      });
  });

  app.put("/listings", (req, res) => {
    db.collection("marketplace").findOneAndUpdate(
      { _id: ObjectId(req.body.itemId) },
      {
        $set: {
          buyer: req.body.buyer,
          isAvailabale: false,
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      (err, result) => {
        if (err) return res.send(err);
        res.send(result);
      }
    );
  });

  app.post("/editListing", (req, res) => {
    console.log(req.body)
    db.collection("marketplace").findOneAndUpdate(
      { _id: ObjectId(req.body.itemId) },
      {
        $set: {
         description: req.body.description
       
        },
      },
      {
        sort: { _id: -1 },
        upsert: true,
      },
      (err, result) => {
        if (err) return res.send(err);
        res.redirect('/listings');
      }
    );
  });


  app.get("/purchased", isLoggedIn, function (req, res) {
    db.collection("purchased")
      .find({ user: req.user.local.email })
      .toArray((err, data) => {
        console.log(data);
        if (err) return console.log(err);
        db.collection("marketplace")
          .find()
          .toArray((err, listings) => {
            console.log(listings);
            if (err) return console.log(err);
            res.render("purchased.ejs", {
              data,
              myEmail: req.user.local.email,
              myAddress: req.user.local.address,
              listings: listings,
            });
          });
      });
  });

  app.post("/purchase/:id", isLoggedIn, (req, res) => {
    const item = db
      .collection("marketplace")
      .find({ _id: ObjectId(req.params.id) })
      .toArray((err, item) => {
        db.collection("purchased").save(
          { item, purchasedOn: new Date(), user: req.user.local.email },
          (err, result) => {
            if (err) return res.send(err);
            res.redirect("/purchased");
          }
        );
      });
  });

  app.delete("/marketplace", isLoggedIn, (req, res) => {
    const _id = ObjectId(req.body._id);
    db.collection("marketplace").findOneAndDelete({ _id }, (err, result) => {
      if (err) return res.send(500, err);
      res.send("Message deleted!");
    });
  });

  // PROFILE SECTION =========================
  app.get("/profile", isLoggedIn, function (req, res) {
    db.collection("messages")
      .find()
      .toArray((err, result) => {
        if (err) return console.log(err);
        const isNewMom = req.user.local.momType == "first-time-mom";
        // if (isNewMom) {
        //   res.render('newMomProfile.ejs')
        // }
        // else{
        res.render("profile.ejs", {
          user: req.user.local,
          messages: result,
        });
        // }
      });
  });

  // LOGOUT ==============================
  app.get("/logout", function (req, res) {
    req.logout(() => {
      console.log("User has logged out!");
    });
    res.redirect("/");
  });

  // message board routes ===============================================================

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // process the login form
  app.post(
    "/login",
    passport.authenticate("local-login", {
      successRedirect: "/profile", // redirect to the secure profile section
      failureRedirect: "/login", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // SIGNUP =================================
  // show the signup form
  app.get("/signup", function (req, res) {
    res.render("signup.ejs", { message: req.flash("signupMessage") });
  });

  // process the signup form
  app.post(
    "/signup",
    passport.authenticate("local-signup", {
      successRedirect: "/welcome-msg", // redirect to the secure profile section
      failureRedirect: "/signup", // redirect back to the signup page if there is an error
      failureFlash: true, // allow flash messages
    })
  );

  // ===================================================

  app.get("/welcome-msg", function (req, res) {
    client.messages
      .create({
        body: "Welcome to my app",
        from: "+18886045109",
        to: "+16103875392",
      })
      .then((message) => {
        console.log("message sent!", message.sid);
        res.redirect("/profile");
      })
      .catch((error) => console.error(error));
  });

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get("/unlink/local", isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect("/profile");
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();

  res.redirect("/");
}
