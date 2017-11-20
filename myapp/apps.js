var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser')
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var x = 0;


//Database

var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "2Asdduwas123",
    database: "mydb"
  });

  pool.getConnection(function(err,con) {
    if (err) throw err;
    con.query("SELECT * FROM logdata", function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      con.release();
    });
  });

  /*pool.getConnection(function(err,con) {
    if (err) throw err;
    var sql = "CREATE TABLE logdata (ID int NOT NULL AUTO_INCREMENT, username VARCHAR(255), password VARCHAR(255), email VARCHAR(255), salt VARCHAR(255))";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("Table deleted");
    });
});*/

var urlencodedParser = bodyParser.urlencoded({extended:false});

//express functions (callbacks) 

app.use(express.static('public'));
app.get('/index.htm', function (req, res) {
    console.log("Seite verlangt!");
   res.sendFile( __dirname + "/" + "index.htm" );
})

app.get('/',function(req,res){
    console.log("standard");
})

app.get('/register.htm',function(req,res){
    console.log("Registrierung HIERE!!!!");
    res.sendFile( __dirname + "/" + "register.htm")
})

app.post('/process_login', urlencodedParser, function (req, res) {
    console.log(req.body);
    /*response = {
       first_name:req.body.first_name,
       password:req.body.password
    };
    console.log(response);*/


    var ress = res;
    un = req.body.first_name;
    pw = req.body.password;

    pool.getConnection(
        function(err,con){
            if(err)throw err;
            var sql = "SELECT password,salt FROM logdata WHERE (username='"+un+"')";
            //console.log(sql);
            /*, password ='"+pw+"')";*/
            con.query(sql, function (err, result, fields) {
                if (err)throw err;
                //console.log(result);
                var strres = JSON.stringify(result).trim();
                var password = strres.substring(14,strres.length-29);
                var salt = strres.substring(14+password.length+10,strres.length-3);
                console.log(strres);
                console.log(password);
                console.log(salt);
                if(strres === "[]"){
                    console.log("User not found");
                    res.sendFile( __dirname + "/" + "index.htm");
                }
                else{
                    var sha512 = function(password, salt){
                        var hash = crypto.createHmac('sha512', salt); 
                        hash.update(password);
                        var value = hash.digest('hex');

                        return {
                            salt:salt,
                            passwordHash:value
                        };
                    };

                    var checklog = sha512(pw,salt);
                    if(checklog.passwordHash===password){
                        res.sendFile( __dirname + "/"+ "Profil.html");
                    }else{
                        res.sendFile( __dirname + "/" + "index.htm");
                    }
                    
                };
                x=1;
                con.release();
            });
        }
    );
});

app.post('/process_register', urlencodedParser, function(req,res){
    console.log(req.body);
    var pw = req.body.password;

    pool.getConnection(function(err,con){
        if(err)throw err;
        con.query("SELECT * FROM logdata WHERE (username ='"
        +req.body.username+"')", function(err, result){
            if(err)throw err;
            console.log(result);
            var strres = JSON.stringify(result);
            if(strres === "[]"){
                console.log("Username available");
                con.query("SELECT * FROM logdata WHERE (email ='"
            +req.body.email+"')", function (err, result){
                if(err)throw err;
                console.log(result);
                var stremail = JSON.stringify(result);
                if(stremail ==="[]"){
                    console.log("E-Mail available");
                    if(pw.length > 5 && pw.length < 20){

                        var genRandomString = function(length){
                            return crypto.randomBytes(Math.ceil(length/2))
                                    .toString('hex') 
                                    .slice(0,length);   
                        };
                        var sha512 = function(password, salt){
                            var hash = crypto.createHmac('sha512', salt); 
                            hash.update(password);
                            var value = hash.digest('hex');
                            return {
                                salt:salt,
                                passwordHash:value
                            };
                        };
                        function saltHashPassword(userpassword) {
                            var salt = genRandomString(16); 
                            var passwordData = sha512(userpassword, salt);
                            console.log('UserPassword = '+userpassword);
                            console.log('Passwordhash = '+passwordData.passwordHash);
                            console.log('nSalt = '+passwordData.salt);
                            con.query("INSERT INTO logdata (username,password,email,salt) Values('"
                            +req.body.username+"','"
                            +passwordData.passwordHash+"','"
                            +req.body.email+"','"
                            +passwordData.salt+"')",function(err,result){
                                if(err)throw err;
                                console.log("Inserted");
                                con.release();
                            })
                        }
                        saltHashPassword(pw);
                       /*bcrypt.hash(pw,10,function(err,hash){
                            if(err)throw err;
                            con.query("INSERT INTO logdata (username,password,email) Values ('"
                            +req.body.username+"','"
                            +hash+"','"
                            +req.body.email+"')",function(err,result){
                                if(err)throw err;
                                console.log("Inserted");
                                con.release();
                            });
                        });*/

                    }else{
                        console.log("Password to long/short");
                        res.sendFile( __dirname + "/" + "register.htm");
                        con.release();
                    }
                }else{
                    console.log("E-Mail taken");
                    con.release();
                }
            });
            }else{
                console.log("Username taken");
                con.release();
            }
        });
    });

});
    

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)

})