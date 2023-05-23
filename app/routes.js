const { result } = require("lodash");
const { ObjectId } = require("mongodb");
// Set environment variables for your credentials: PUT THESE SECRETS IN A .ENV FILE BEFORE PUSHING
const accountSid = "AC2378d3d252c198052c00a4d3bafd6d38";
const authToken = "646c251363ef5ad393f95e4d5a0e8681";
const client = require("twilio")(accountSid, authToken);
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs'); 
// delete fs if test fails
require('dotenv').config();
// test =======
const { ComputerVisionClient} = require("@azure/cognitiveservices-computervision");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");

const key = '27a7070fe6d243be8b914d47e6e5189d';
const endpoint = 'https://momappdemo.cognitiveservices.azure.com';
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }),
  endpoint
);
module.exports = function (app, passport, db, multer) {
  // Image Upload Code =========================================================================
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/uploads');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });
  
 

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  // starter api for my marketplace feature, users can buy and sell products. (more work to be done during the week, i also still have to work on the login page.)
  app.get("/", function (req, res) {
    res.render("signup.ejs");
  });

  app.get("/groupChat", isLoggedIn, function (req, res) {
    res.render("chat.ejs", {
      user: req.user.local,
    });
  });

  app.get("/enterChat", isLoggedIn, function (req, res) {
    res.render("enterChat.ejs", {
      user: req.user.local,
    });
  });

  app.get("/marketplace", isLoggedIn, function (req, res) {
    let boughtItems = [];
    let filter = req.query.price ? {price: parseInt(req.query.price )} : undefined
    db.collection("marketplace")
      .find( filter)
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
  //  TEST+++++++==========
  app.post("/upload", upload.single("file"), (req, res) => {
    // Access the uploaded file using req.file
    if (!req.file) {
      // No file was uploaded
      return res.status(400).send("No file chosen");
    }
  
    // File was uploaded successfully
    // Handle the uploaded file here
    console.log("Uploaded file:", req.file);
  
    // Send a response indicating success
    res.status(200).send("File uploaded successfully");
  });
  
 

  app.post("/sell", isLoggedIn, upload.single("file-to-upload"), (req, res) => {
    const { title, price, address, description,condition, age } = req.body;
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
          myAddress: req.user.local.address
        });
      })
      });
  });


  app.get("/purchased", isLoggedIn, function (req, res) {
    db.collection("purchased")
      .find({ user: req.user.local.email })
      .toArray((err, data) => {
        console.log(data);
        if (err) return console.log(err);
        res.render("purchased.ejs", {
          data,
          myAddress: req.user.local.address,
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
  // TEST ===============================================
// Render the form page for uploading the cut image
app.get('/analyze-cut', isLoggedIn, function (req, res) {
  const description = 'Analyzed cut description goes here';
  res.render('analyze-cut.ejs', { description: description });
});
app.post('/analyze-cut', upload.single('image'), function(req, res) {
  // Get the file path of the uploaded image
  const imagePath = req.file.path;

  // Set the desired visual features for analysis
  const features = ['Objects', 'Image_type'];
  const domainDetails = [];

  // Construct the parameters for analysis
  const parameters = {
    visualFeatures: features.join(','),
    details: domainDetails.join(',')
  };

  // Perform the image analysis using the specified visual features
  analyzeCutImage(imagePath, parameters)
    .then(result => {
      // Process the analysis result
      // Your code for processing the analysis result goes here...

      // Add the image URL to the analysis result
      result.imageUrl = req.file.filename;

      // Send the analysis result as JSON response
      res.status(200).json(result);
    })
    .catch(error => {
      // Handle the error
      // Your error handling code goes here...
      res.status(500).json({ error: 'Image analysis failed' });
    });
});


// Helper function to analyze the cut image
async function analyzeCutImage(imagePath) {
  // Use the Computer Vision client to analyze the image
  const imageBuffer = fs.readFileSync(imagePath);
  const result = await computerVisionClient.describeImageInStream(imageBuffer);

  // Extract the description from the result
  const description = result.captions.length > 0 ? result.captions[0].text : 'Unable to analyze the cut image';

  return description;
}


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

  // Calendar routes ===============================================================

  // Display the calendar page
  const { ObjectId } = require("mongodb");


  // ...
  app.get("/getAi", function (req, res) {
    res.render("Ai.ejs",{
      answer: null
    });
  });


  // open ai

  app.post("/getAi", async (req, res) => {
    console.log(req.body);
    
  
    try {
      console.log('key' ,process.env.OPENAI_API_KEY)
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
  
      const openai = new OpenAIApi(configuration);
      const prompt = req.body.question;
      // let prompt = "How much Tylenol can I give a 6-month-old:";
      
      console.log(prompt);
  
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });
  
      const answer = completion.data.choices[0].message.content;
      console.log(completion.data.choices[0].message);
  
      res.render("Ai.ejs", { answer });
    } catch (error) {
      console.error("Error generating dose:", error);
      res.status(500).json({ error: "Failed to generate dose" });
    }
  });
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