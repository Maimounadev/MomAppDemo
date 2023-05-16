const { ObjectId } = require("mongodb");
// Set environment variables for your credentials: PUT THESE SECRETS IN A .ENV FILE BEFORE PUSHING
const accountSid = "AC2378d3d252c198052c00a4d3bafd6d38";
const authToken = "f164e5c71364b823498b1407dc053c63";
const client = require("twilio")(accountSid, authToken);

module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    // starter api for my marketplace feature, users can buy and sell products. (more work to be done during the week, i also still have to work on the login page.)
    app.get('/', function(req, res) {
        res.render('signup.ejs');
    });

    app.get('/groupChat', isLoggedIn, function(req,res){
      res.render('chat.ejs', {
        user: req.user.local
      })
    })

    app.get('/enterChat', isLoggedIn, function(req,res){
      res.render('enterChat.ejs', {
        user: req.user.local
      })
    })

    app.get('/marketplace', isLoggedIn, function(req, res) {
      db.collection('marketplace').find().toArray((err, items) => {
        if (err) return console.log(err)
        res.render('marketplace.ejs', {
          items, 
          myAddress: req.user.local.address
        });
      })
  });

  app.post('/sell', isLoggedIn, (req, res) => {
    const { title, price, address, description } = req.body 
    db.collection('marketplace').save({title, price: Number(price), address, seller: req.user.local.email, description}, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/marketplace')
    })
  })

   app.get('/purchased', isLoggedIn, function(req, res) {
      db.collection('purchased').find({user: req.user.local.email}).toArray((err, data) => {
        console.log(data)
        if (err) return console.log(err)
        res.render('purchased.ejs', {
          data,
          myAddress: req.user.local.address,
        });
      })
  });

  app.post('/purchase/:id', isLoggedIn, (req, res) => {
  const item =  db.collection('marketplace').find({_id: ObjectId(req.params.id)}).toArray((err, item) => {
    db.collection('purchased').save({item, purchasedOn: new Date(), user: req.user.local.email}, (err, result) => {
      if (err) return res.send(err)
      res.redirect('/purchased')
})
    })
  });

  app.delete('/marketplace', isLoggedIn, (req, res) => {
    const _id = ObjectId(req.body._id)
    db.collection('marketplace').findOneAndDelete({ _id}, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
          if (err) return console.log(err)
          const isNewMom = req.user.local.momType == 'first-time-mom'
          // if (isNewMom) {
          //   res.render('newMomProfile.ejs')
          // }
          // else{
            res.render('profile.ejs', {
              user : req.user.local,
              messages: result
            })
          // }
  
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// message board routes ===============================================================

    

    
    
// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/welcome-msg', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        })
        );

        app.get('/welcome-msg', function(req,res){
           client.messages
           .create({ body: "Welcome to my app", from: "+18886045109", to: "+16103875392" })
           .then(message => {
            console.log('message sent!', message.sid);
            res.redirect('/profile')
          })
          .catch(error =>
            console.error(error)
          )
        })

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
