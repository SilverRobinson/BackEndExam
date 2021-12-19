const URL   = require('url');
const fs    = require('fs');
const qs    = require('querystring');
const mysql = require('mysql'); 
//|=====================================================|//
const _getIndex=(data,item,sensitivity)=>{
    var type=typeof item,x,y,result=false,xresult,sensitivity=sensitivity||0,ctr;
    if(Array.isArray(data) && data.length>0){
      if(type=="object"){
        if(Array.isArray(item))type="array";
      }
      switch(type){
        case 'array':
            data=data.map(item=>item.toString());
            result=[];
            for(x in item){
              result.push(data.indexOf(item[x].toString()));
            }
        break;
        case 'object':
          var position=0;
          for(x in data){position++;
            xresult=false,ctr=0;
            for(y in Object.keys(item)){ctr++;
                try{
                    if(sensitivity){
                      data[x][Object.keys(item)[y]]=data[x][Object.keys(item)[y]].toLocaleLowerCase();
                      item[Object.keys(item)[y]]=item[Object.keys(item)[y]].toLocaleLowerCase();
                    }  
                    result=(data[x][Object.keys(item)[y]]!==undefined && data[x][Object.keys(item)[y]]===item[Object.keys(item)[y]]) || data[x][Object.keys(item)[y]]=='All';
                    if(!result && Object.keys(item).length>ctr)break;
                    if(result && Object.keys(item).length==ctr)xresult=true;
                }catch(e){}
            }
            if(xresult)break;
          }
          if(xresult)result=position-1;
          else result=xresult;
        break;
        default:
            data=data.map(item=>item.toString());
            if(sensitivity){
              data=data.map(item=>item.toLowerCase());
              result=data.indexOf(item.toLowerCase());
            }else{
              result=data.indexOf(item.toString());
            }
      }
    }
    return result;
}
const _CreateTB=({TBName,DBName,fields,data,con})=>{
    con.query(`Show Tables;`,(err,result)=>{
        if (err) throw err;
        if(_getIndex(result,{['Tables_in_'+DBName.toLowerCase()]:TBName},1)===false){
            let str=`CREATE TABLE ${DBName}.${TBName}`;
            let fstr='',pstr='';
            for(column in fields){
                const {type,allowNull,autoInc,primary}=fields[column]
                if(fstr!=='')fstr+=','
                fstr+=`${column} ${type} ${allowNull?'Null':'Not Null'} ${autoInc?'AUTO_INCREMENT':''}`
                if(primary){
                    if(pstr!=='')pstr+=',';
                    pstr+=column
                }
            }
            fstr=`(${fstr},PRIMARY KEY (${pstr}))`;
            con.query(`${str} ${fstr} ENGINE = InnoDB`);
        };
    })
}
const _CreateDB=(con,DBName)=>{
    con.query(`Show Databases;`,(err,result)=>{
        if (err) throw err;
        // console.log(_getIndex(result,{Database:DBName},1))
        if(_getIndex(result,{Database:DBName},1)===false){
            con.query(`CREATE DATABASE ${DBName}`)
        }
        con.query(`use ${DBName}`)
        const model=_getModel();
        for(TB in model){
            const {table_name,fields,data}=model[TB]
            const TBName=table_name||TB
            _CreateTB({TBName,DBName,fields,data,con})
        }
    })
}
const SystemPreparation=({username,password,host},callback)=>{
    const con=_DBConnect({username,password,host},callback)
    // console.log("con:",con)
    _CreateDB(con,'AccountDB')
}
const _MYSQLConnect=({username,password,host})=>{
    return mysql.createConnection({
        host,
        user: username,
        password
    });
}
const _DBConnect=({username,password,host},callback)=>{
    const con = _MYSQLConnect({username,password,host})
      
    con.connect(function(err) {
        if (err){
            const error=[{status:false},{result:"Connection Failed"}]
            Object.keys(err).map(data=>{
                error.push({data:err[data]})
            })
            return  callback(error);    
        } 
        callback([{status:true},{result:"Connected!"}]);
    });
    return con;
}
const _responseHandler=(data,status)=>{
    return JSON.stringify({
        status,
        data
    })
}
const _routeCaller=(API,data)=>{
    let [method,path]=data.split(' '),params;
    path=path.split('/').slice(1);
    for(let route in API){
        let [RMethod,RPath]=route.split(' ')
        let match=true;
        if(method===RMethod){
            params=[];
            RPath=RPath.split('/').splice(1)
            for(let idx in path){
                if(path[idx]!=='' && !RPath[idx]){
                    match=false;
                    break;
                }
                if(path[idx]!=='' && path[idx]!==RPath[idx] && !RPath[idx].includes(':')){
                    match=false
                    break;
                }
                if(RPath[idx] && RPath[idx].includes(':'))params.push({[RPath[idx].replace(':','')]:path[idx]})

            }
            
        }else match=false;
        if(match){
            return [API[route].api,params]
        }
    }
    return [()=>{return _responseHandler("Invalid Route",false)},[]]
}
const _routeFixer=data=>{
    let route='',ctr=0;
    if(!data.includes(':') && data.substr(data.length-1,1)!=='/')data+='/';
    data=data.split('/');
    data.map(item=>{ctr++;
        item=item.includes(':')?item:item.toLocaleLowerCase()
        if(ctr>1)route+='/';
        route+=item;
    })        
    return route
}  
const _getAPI=()=>{
    const API={};
    const Route={};
    const dir = `./api/`;
    const folder = fs.readdirSync(dir).filter(data=>data.search(".js")<0);
    folder.map(FolderName=>{
        const dir = `./api/${FolderName}`;
        const files = fs.readdirSync(dir);    
        let file;
        API[`${FolderName}`]={}
        files.map(data=>{
            file = require(`${dir}/${data}`);
            API[`${FolderName}`][`${data.split('.')[0]}`]=file;
        })
    })

    for(let folder in API){
        const Folder=API[folder]
        for(let file in Folder){
            let {api,route}=Folder[file];
            if(route){
                let [method,path]=route.split(' ');
                route=`${method} ${_routeFixer(path)}`
                if(!Route[route])Route[route]={}
                Route[route].api=api
            }
        }
    }
    return Route
}
const _getModel=()=>{
    const Model={};
    const dir = `./model/`;
    const files = fs.readdirSync(dir);
    files.map(file=>{
        const TB = require(`${dir}${file}`);
        Model[`${file.split('.')[0]}`]=TB
    })
    return Model
}
const _cmd=()=>{
    let args = process.argv
    let config={};
    args=args.slice(2);
    args.map(data=>{
        data=data.split('=');
        config[data[0].toLocaleLowerCase()]=Number(data[1])?Number(data[1]):data[1];
        return 
    })
    return config
}
const _middleware=(req,callback=()=>{})=>{
    let body='';
    req.on('data', function (data) {
        body+=data
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)req.connection.destroy();
    });

    req.on('end', function () {
        const data={}
        if(body.includes('{') && !body.includes('Content-Type: image'))body=JSON.parse(body);
        else{
            let item=body.split('Content-Disposition: form-data; name="').splice(1)
            for(let part of item){
                const key=part.split('"');
                const [val]=key[1].split('\r\n').splice(2,1)
                data[key[0]]=val
            }
            body=data;
        }
        callback(body)
    });
    return body;
}
const _input=require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
})
const ServerInput=(label,callback=()=>{},close)=>{
    _input.question(label, input => {
        callback(input)
        if(close)_input.close();
    })
}
const Config=(()=>{
    let config={
        host:"localhost",
        username:"root",
        password:"root",
        port:5000,
        ready:"Connecting..."
    }
    const args =  _cmd()
    config={...config,...args}
    return config
})()
const GenerateAPI=(()=>{
    const API=_getAPI();
    // console.log("Routes:",API)
    return (req,callback)=>{
        const {url,method,headers}=req;
        // console.log("headers:",headers);
        let {pathname,query} = URL.parse(url, true);
        pathname=_routeFixer(pathname)
        const route=`${method.toLocaleLowerCase()} ${pathname.toLocaleLowerCase()}`;
        const [func,params]=_routeCaller(API,route);
        _middleware(req,d=>{
            req.body=d
            req.query=query
            req.params=params
            const result=func(req);
            callback(typeof result==='string'?result:_responseHandler(result,true));
        })        
    }
})

module.exports={Config,GenerateAPI,ServerInput,SystemPreparation};