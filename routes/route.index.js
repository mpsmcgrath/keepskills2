var moment = require('moment');
moment().format();

var AddEmail    = require('../models/model.addemail')
var User    = require('../models/model.users')
var Bookings    = require('../models/model.bookings')

//Nodemailer for the contact form
var nodemailer  = require('nodemailer');
var mg          = require('nodemailer-mailgun-transport');
// API key from mailgun.com/cp (free 10K of monthly emails) - used with Nodemailer
var auth        = {auth: {api_key: 'key-fa1d0fc3a46d962e53f041917ccea81b',domain: 'mail.keepskills.com'}}
var nodemailerMailgun = nodemailer.createTransport(mg(auth));


//export all the routes so we don't need to list them all in app.js
module.exports  = function(app, express) {


  app.use(function(req,res,next){ 
    res.locals.isLoggedIn = req.isAuthenticated(); 
   next(); 
});

app.use(function(req, res, next) {
    // Blank function - Analytics? Validation?
    console.log('Logging middleware goes here before next() function');
    next(); // make sure we go to the next routes and don't stop here
});


// GET about page.
app.get('/about', function(req, res, next) {
      var isLoggedIn = res.locals.isLoggedIn
  res.render('about', { 
  	title: 'About',  
  });
});

// GET contact page.
app.get('/contact', function(req, res) {
      var isLoggedIn = res.locals.isLoggedIn
  res.render('contact', { 
    title: 'Contact',
    expressFlash: req.flash('success')  
  });
});

// GET t&cs page.
app.get('/termsandconditions', function(req, res) {
      var isLoggedIn = res.locals.isLoggedIn
  res.render('termsandconditions', { 
    title: 'Terms and Conditions',
    expressFlash: req.flash('success')  
  });
});

// GET how it works page.
app.get('/howitworks', function(req, res) {
      var isLoggedIn = res.locals.isLoggedIns
  res.render('howitworks', { 
    title: 'How it Works',  
  });
});

//Submit contact form
app.post('/contactformsend', function(req, res){
  console.log('contact form send');

nodemailerMailgun.sendMail({
  from: req.body.email,
  to: 'mpsmcgrath@gmail.com', // An array if you have multiple recipients.
  subject: 'Contact form: ' + ' - ' + req.body.name,
  'h:Reply-To': req.body.email,
  //HTML email content can be sent straight from the message variable
  html: req.body.message,
  //You can use plain "text:" either
 // text: 
}, function (err, info) {
  if (err) {
    console.log('Error: ' + err);
  }
  else {
    console.log('Response: ' + info);
  }
}); 
      //These two lines are express-flash sending a success message back to the refreshed homepage
      req.flash('success', 'Thank you for your message! '+req.body.name+' we will be in touch shortly');
      res.redirect(301, '/contact');
});


    // =====================================
    // APIS ================================
    // =====================================

//delete request
  app.delete('/api/oneuser/teacher-:_id', function(req, res) {

  console.log('DELETE');
  
  User.remove({
    _id: req.params._id
  }, function(err, user) {
    if (err)
      res.send(err);

    res.json({ message : 'Successfully Deleted' });
  })
});


//Put request GETs user by Object id then PUTs firstName into user and saves to db
  app.put('/api/oneuser/:_id', function(req, res, next) {

  console.log('PUT');
  
  User.findById(req.params._id, function(err, user) {
  
            if (err) res.send(err);
  
            user.firstName = req.body.firstName;
  
  console.log('PUT Request for object _id from req.params._id which is: ' + req.params._id);

            //save the user
            user.save(function(err){
              if (err) res.send(err);

              res.json({ message: 'User updated'})
            })
          })
  });

      app.get('/api/availability/:user_id', function(req, res) {
        Bookings.findById(req.params.user_id, function(err, bookings) {
            if (err)
                res.send(err);

            res.json(bookings);
            console.log('test for availability GET');
        });
    })

app.post('/api/availability', function(req, res){
  
  availability = req.body;

        var booking = new Bookings();      // create a new instance of the booking model
        booking.availability = availability;  // set the availability equal to our array of JSON objects (start/end/day of week)
        booking._id = req.user._id;
        booking.save(function(err) {
            if (err)
                res.send(err);

 res.send('success'+req.body);
});
});




app.post('/api/users', function(req, res, next) {
        
        var user = new User();      // create a new instance of the User model
        user.firstName = req.body.firstName;  // set the users name (comes from the request)
        user.username = req.body.username;
        user.userid = req.body.userid;
        user.isTeacher = req.body.isTeacher;

        // save the user and check for errors
        user.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'User created!' });
        })})

      .get('/api/users', function(req, res) {
        User.find(function(err, users) {
            if (err)
                res.send(err);

            res.json(users);
        });
    })

      .get('/api/users/subjects', function(req, res) {
        User.find().distinct('subjectName', function(err, users) {
            if (err)
                res.send(err);
              res.send(JSON.stringify(users));          
        });
    })

      .get('/api/users/locations', function(req, res) {
        User.find().distinct('city', function(err, users) {
            if (err)
                res.send(err);
              res.send(JSON.stringify(users));          
        });
    })

app.get('/t_:_id', function(req, res) {
  var user;
           User.findById(req.params._id, function(err, user) {
            if (err) res.send(err);


console.log('req.params._id = '+req.params._id)
      
            var isLoggedIn = res.locals.isLoggedIn
            var booking
            var monAvailTime = ''
            var tueAvailTime = ''
            var wedAvailTime = ''
            var thuAvailTime = ''
            var friAvailTime = ''
            var satAvailTime = ''
            var sunAvailTime = ''

          getAvailibility();
function getAvailibility() {
            //Find the availability slots for the Teacher and convert the timestamps to 
            //readable times using momentJS. Then pass to the view and the booking widget
            Bookings.findOne({ '_id':req.params._id }, function (err, booking) {
            if (err) return handleError(err);
           for (i=0; i<booking.availability.length; i++){
                if(booking.availability[i].dow == 0){
                    monAvailTime = monAvailTime+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                else if(booking.availability[i].dow == 1){
                    tueAvailTime = tueAvailTime+' '+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                else if(booking.availability[i].dow == 2){
                    wedAvailTime = wedAvailTime+' '+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                else if(booking.availability[i].dow == 3){
                    thuAvailTime = thuAvailTime+' '+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                else if(booking.availability[i].dow == 4){
                    friAvailTime = friAvailTime+' '+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                else if(booking.availability[i].dow == 5){
                    satAvailTime = satAvailTime+' '+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                else if(booking.availability[i].dow == 6){
                    sunAvailTime = sunAvailTime+' '+moment.utc(booking.availability[i].start).format("HH:mm")+' - '+moment.utc(booking.availability[i].end).format("HH:mm")+' <br>'}
                           console.log('booking dow: '+booking.availability[i].dow)
                           console.log('booking monAvailTime: '+monAvailTime)
                           console.log('booking tueAvailTime: '+tueAvailTime)
                           console.log('booking wedAvailTime: '+wedAvailTime)
                           console.log('booking thuAvailTime: '+thuAvailTime)
                           console.log('booking friAvailTime: '+friAvailTime)
                           console.log('booking satAvailTime: '+satAvailTime)
                           console.log('booking sunAvailTime: '+sunAvailTime)        
                       } // end for loop


res.render('profile.ejs', {
            user : user, 
            mon : monAvailTime,
            tue : tueAvailTime,
            wed : wedAvailTime,
            thu : thuAvailTime,
            fri : friAvailTime,
            sat : satAvailTime,
            sun : sunAvailTime
}); //end res.render
}) //end Bookings.findOne
} //end getAvailibility
}) // end findById 
}) //end route



    // User.findById(req.params._id, function(err, user) {
    //         if (err) res.send(err);
    //         console.log('findById function!!!')
    //     });




// app.get('/teacher-:_id', function(req, res, next) {
//         console.log('Request for object _id from req.params._id which is: ' + req.params._id);
//                     var isLoggedIn = res.locals.isLoggedIn
//       User.findById(req.params._id, function(err, user) {
//             if (err) res.send(err);
//         res.render('profile.ejs', {
//             user : user, 
// })
//         });

// })










//Routes for Email Mailing List
      app.get('/addemail', function(req, res) {
        AddEmail.find(function(err, emails) {
            if (err)
                res.send(err);

            res.json(emails);
            console.log('test for addemail GET');
        });
    })



app.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.sessionFlash = req.session.sessionFlash;
    delete req.session.sessionFlash;
    next();
});

      app.post('/addemail', function(req, res, next){
        var emailList = new AddEmail();      // create a new instance of the User model
        emailList.mailingListEmailAddress = req.body.mailingListEmailAddress;  // set the users name (comes from the request)
        emailList.save(function(err) {
            if (err)
                res.send(err);
        })

      //These two lines are express-flash sending a success message back to the refreshed homepage
      req.flash('success', 'Thank you for signing up! '+req.body.mailingListEmailAddress+' has been added to our mailing list');
      res.redirect(301, '/');

    });

        app.delete('/addemail/:mailingListEmailAddress', function(req, res, next) {

  console.log('DELETE');
  
  AddEmail.remove({
    mailingListEmailAddress: req.params.mailingListEmailAddress
  }, function(err, email) {
    if (err)
      res.send(err);
    console.log(req.params.mailingListEmailAddress);
    res.json({ message : 'Successfully Deleted', });
  })
});


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
}
// module.exports = app;
