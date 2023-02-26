/*Link to app on heroku: https://vast-reef-58644.herokuapp.com/*/

const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const https = require("https");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
dotenv.config();

//for proper working at heroku cloud, our app listens on process.env.PORT
app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running at port 3000");
})

app.get("/", (req,res) => {
    res.sendFile(__dirname + "/templates/signup.html");
});

app.post("/", (req,res) => {

    //Getting the posted form data field by field
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;

    //making a JS object to pass to mailchimp server on POST request (as per mailchimp API docs)
    const data = {
        members:[
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                }
            }
        ]
    }
    const jsonData = JSON.stringify(data);
    
    /*  POST jsonData on mailchimp server through API
        us20, because API key has us20 and last endpoint is mailchimp's Audience ID
    */
    const url = `https://us20.api.mailchimp.com/3.0/lists/${process.env.AUDIENCE_ID}`;
    const options = {
        method: "POST",
        //auth is a Basic Authentication of "username:password"
        auth: `${process.env.MAILCHIMP_USERNAME}:${process.env.API_KEY}`
    }
    const request = https.request(url, options, (response) => {
        response.on("data", (data) => {
            //ClientRequest object returned
            const obj = JSON.parse(data);

            //checking if POST request was successfull and data is posted on mailchiimp server
            if (response.statusCode !== 200 || obj.errors.length != 0) {
                res.sendFile(__dirname + "/templates/failure.html");
            }
            else {
                res.sendFile(__dirname + "/templates/success.html");
            }
        });
    });

    //write data to ClientRequest object body
    request.write(jsonData);
    request.end();
});

app.post("/failure", (req,res) => {
    res.redirect("/");
});