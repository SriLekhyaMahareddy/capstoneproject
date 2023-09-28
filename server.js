const express = require('express')
const app = express()
const port = 8000
const request = require("request");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
var bodyParser=require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
var ph=require('password-hash');
var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get('/weather', (req, res) => {
  res.render("signup");
})

app.post('/signupsubmit', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const pwd = req.body.pwd;
  db.collection("users")
            .where('email', '==', email)
            .get()
            .then((docs) => {
                if (docs.size > 0) {
                    res.send( "User with email id already exists");    
                } else {
                    db.collection("users")
                  .add({
      name: name,
      email: email,
      password: ph.generate(pwd),
    })
                    .then(()=>{
                        res.redirect('/signin');
                    })
                }
            });
    });
  


app.get('/signin', (req, res) => {
  res.render("signin");
});


app.post('/signinsubmit', (req, res) => {
  const email = req.body.email;
  const password = req.body.pwd;
  db.collection("users")
    .where("email", "==", email)
    .get()
    .then((docs) => {
      let verified=false;
      docs.forEach(doc=>{
        verified=ph.verify(password,doc.data().password);
      })
      if (verified) {
        //query my database with all the users only when login is succefull
          res.render("weather");
      } else {
        res.render("loginfail");
       
      }
    });      
});

app.get('/weathersubmit',(req,res) =>{
  const location = req.query.location;
  request(
    'https://api.openweathermap.org/data/2.5/weather?q='+location+'&APPID=98689aba59271ff5c9f0f6af916a993a', function (error, response, body){
      if("error" in JSON.parse(body))
      {
        if((JSON.parse(body).error.code.toString()).length > 0)
        {
          res.render("weather");
        }
      }
      else
      {
        const pre = JSON.parse(response.body);
        const wther = pre.weather[0].main;
        const temp = pre.main.temp;
        const pressure = pre.main.pressure;
        const humidity = pre.main.humidity;
        const ws = pre.wind.speed;
        const con = pre.sys.country;
        res.render('location',{location:location,wther:wther,temp:temp,pressure:pressure,humidity:humidity, ws: ws,con:con});
      } 
    }
    );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})