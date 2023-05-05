const { ObjectId } = require("mongodb");

module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('signup.ejs');
    });
    app.get('/marketplace', function(req, res) {
      db.collection('marketplace').find().toArray((err, items) => {
        if (err) return console.log(err)
        res.render('marketplace.ejs', {
          items, 
          myAddress: req.user.local.address
        });
      })
      
  });
  app.post('/sell', (req, res) => {
    const { title, price, address } = req.body 
    db.collection('marketplace').save({title, price: Number(price), address, seller: req.user.local, sold: false}, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/marketplace')
    })
  })
  app.put('/buy', (req, res) => {
    db.collection('marketplace')
    .findOneAndUpdate({_id: ObjectId(req.body._id)}, {
      $set: {
        sold:true
      }
    }, {
      sort: {_id: -1},
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
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
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        })
        );

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
