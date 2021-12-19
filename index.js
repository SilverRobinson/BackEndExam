//|=====================| Dev Introduction |=============================|//
console.log(" ");
console.log("Backend Server Exam is Now Operation");
console.log("====================================");
console.log("Develop By Jay Robinson Ong"); 
console.log(" ");
//|======================================================================|//
const JS    = require('./helper');                     //|My Personal Helper
const http  = require('http');
//|----------------------------------------------------------------------|//
let {Config:{port,host,username,password,ready},GenerateAPI,ServerInput,SystemPreparation}=JS,API;
//|======================| Admin Registration |==========================|//
console.log('This server may ask your MySQL Credentials to fully operate. Skipping this input will lead to use the system default MYSQL Credential');  
ServerInput('Please enter your MYSQL Server IP Address [ default : locahost ]:',data=>{
  host=data||host
  ServerInput('Please enter your Username in MYSQL Server [ default : root ]:',
  data=>{
    username=data||username;
    ServerInput('Please enter your Password in MYSQL Server [ default : root ]:',data=>{
      password=data||password;
      console.log('')
      console.log("================================================================");
      console.log("This is your Server Configiration")
      console.log("Host:",host);
      console.log("Username:",username);
      console.log("Password:",password);
      console.log("Server Port:",port);
      console.log("================================================================");
      console.log('')  
      API=GenerateAPI();
      console.log("Status:",ready);
      SystemPreparation({host,username,password},result=>{
        if(result[0].status===false){
          console.log(result[1].result)
          console.log('=============================')
          Object.keys(result).splice(2).map(data=>{
            console.log(result[data].data)
          })
          ready=result[1].result;
        }
        else{
          ready='Ready';
          console.log("Status:",ready)
        }
      });
    },true);
  })
})


//|======================================================================|//
http.createServer((req, res)=>{
  try{
    req.server=ready
    API(req,result=>{
      res.writeHead(200, {'Content-Type': 'application/json;charset=UTF-8'});
      res.write(result);
      res.end();
    });
    
  }catch(e){
      console.log("--------------------------------------")
      console.log("Error:",e)
      console.log("--------------------------------------")
  }  
}).listen(port); 