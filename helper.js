const URL   = require('url');
const fs    = require('fs');
const qs    = require('querystring');
const mysql = require('mysql'); 
//|=====================================================|//
let Add,Edit,Delete,Get;
//|-------------------| My Import Script |--------------|//
const UCWord=(data,space)=>{
    let x,str='';space=space||' ';
    if(data!=undefined){
    const word=data.split(space);
      for(x in word){
        word[x]=word[x].toLowerCase();
          word[x]=word[x].substr(0, 1).toUpperCase()+word[x].substr(1);
          str+=str!=''?' '+word[x]:word[x];
      }
    }
    return str;
}
const Encrypt=({data,key})=>{
    var sum=0;
    key=UCWord(key).split('');
      key.map(char=>sum+=char.charCodeAt(0));
      sum+=key[0].charCodeAt(0)+key[key.length-1].charCodeAt(0);
      var newData='';
      data=data.toString().split('');
      data.map(char=>newData+=String.fromCharCode((char.charCodeAt(0)+sum)%256));
      return bin2hex(newData);
}
const Decrypt=({data,key})=>{
    var sum=0;
    key=UCWord(key).split('');
      key.map(char=>sum+=char.charCodeAt(0));
      sum+=key[0].charCodeAt(0)+key[key.length-1].charCodeAt(0);
      var newData='';
      data=hex2bin(data);
      data=data.toString().split('');
      data.map(char=>newData+=String.fromCharCode(((char.charCodeAt(0)-sum)%256)+256));
      return newData;
}
const hex2bin=hexSource=> {
      var bin = '';
      for (var i=0;i<hexSource.length;i=i+2) {
          bin += String.fromCharCode(hexdec(hexSource.substr(i,2)));
      }
      return bin;
}
const hexdec=hexString=> {
      hexString = (hexString + '').replace(/[^a-f0-9]/gi, '')
      return parseInt(hexString, 16)
}
const bin2hex=s=>{  
    var v,i, f = 0, a = [];  
    s += '';  
    f = s.length;  
  
    for (i = 0; i<f; i++) {  
      a[i] = s.charCodeAt(i).toString(16).replace(/^([\da-f])$/,"0$1");  
    }  
    return a.join('');
 }
//|-----------------------------------------------------|//
const _token=data=>{
    try{
        const [token]=data.split(' ').splice(1);
        const Break=JSON.parse(Decrypt({data:token,key:'key'}));
        // console.log(Break)
        return Break
    }catch(e){
        return {id:undefined}
    }
    
}  
const _parseValue=({type,data,encrypt})=>{
    switch(type.toLocaleLowerCase()){
        case 'int': case 'double': break;
        default:
            if(encrypt)data=Encrypt({data,key:'key'})
            data=`"${data}"`   
    }
    return data
}
const _whereReader=(where,fields,strWhere,{op,sep})=>{
    for(let name in where){
        if(typeof where[name]==='string' || typeof where[name]==='number'){
            const {type,encrypt}=fields[name]
            where[name]=_parseValue({type,data:where[name],encrypt})
            strWhere+=strWhere!==''?` ${sep?sep:'and'} ${name} ${op?op:'='} ${where[name]}`:` ${name} ${op?op:'='} ${where[name]}`
        }else{
            if(Array.isArray(where[name])){
                strWhere+='('
                for(let item of where[name]){
                    strWhere+=`${_whereReader(item,fields,strWhere,{op:undefined})}`
                }
                strWhere+=')'
            }
            if(!Array.isArray(where[name])){
                strWhere+=_whereReader(where[name],fields,strWhere,{op:name})
            }
        }
        
    }
    return strWhere
}
const _filterReader=(data,fields)=>{
    if(data){
        let str='',strOrder='',strWhere='';
        const {where,select,limit,order}=data;
        if(where)   strWhere=`where ${_whereReader(data,fields,strWhere,{op:'='})}`;
        if(select)  select=JSON.stringify(select)
        if(limit)   limit=`limit ${limit}`;
        if(order){
            for(name in order){
                strOrder+=strOrder!==''?`,${name} ${order['name']}`:`${name} ${order['name']}`
            }    
        }
        return where?{where,select,limit,order}:`where ${_whereReader(data,fields,strWhere,{op:'='})}`;
    }
    return '';
}
const _setReader=(data,fields)=>{
    let set=''
    console.log("set",fields,data);
    for(let name in data){
        if(fields[name] && data[name]){
            const {type,encrypt}=fields[name]
            data[name]=_parseValue({type,data:data[name],encrypt})
            set+=set!==''?`,${name}=${data[name]}`:`${name}=${data[name]}`;
        }
    }
    return `set ${set}`
}
const _add=(con=>{
    const model=_getModel();
    return (TB,data)=>{
        return new Promise(resolve=>{
            const {table_name,fields}=model[TB]
            let sql=`insert into ${table_name}`;
            let val='',column='',row='';
            if(Array.isArray(data)){
                data.map(item=>{
                    val=''
                    for(let col in fields){
                        if(item[col]){
                            const {type,encrypt}=fields[col]
                            item[col]=_parseValue({type,data:item[col],encrypt})
                            val   +=val!==''    ?`,${item[col]}`    :item[col];
                            column+=column!=='' ?`,${col}`          :col;
                        }
                    }
                    row +=  row !==''       ?`,(${val})`        :`(${val})`;    
                })
            }else{
                for(let col in fields){
                    if(data[col]){
                        const {type,encrypt}=fields[col]
                        data[col]=_parseValue({type,data:data[col],encrypt})
                        val   +=val!==''    ?`,${data[col]}`    :data[col];
                        column+=column!=='' ?`,${col}`          :col;
                    }
                }
                val=`(${val})`;
            }
            if(row!=='')val=row
            sql=`${sql} (${column}) values ${val}`;
            console.log("===============");
            console.log("SQL:",sql);
            console.log("===============");
            con.query(sql,(err,result)=>{
                if (err) throw err;
                resolve(result)
            })
        })
    }
})
const _edit=(con=>{
    const model=_getModel();
    return (TB,set,filter)=>{
        return new Promise(resolve=>{
            const {table_name,fields}=model[TB]
            let Filter=_filterReader(filter,fields);
            let Set=_setReader(set,fields);
            let sql=`update ${table_name} ${Set} ${Filter}`;
            console.log("===============");
            console.log("SQL:",sql);
            console.log("===============");
            con.query(sql,(err,result)=>{
                if (err) throw err;
                resolve(result)
            })
        })
    }
})
const _delete=(con=>{
    const model=_getModel();
    return (TB,filter)=>{
        return new Promise(resolve=>{
            const {table_name,fields}=model[TB]
            console.log("filter:",filter)
            let Filter=_filterReader(filter,fields);
            console.log("Filter:",Filter)
            let sql=`delete from ${table_name} ${Filter}`;
            console.log("===============");
            console.log("SQL Delete:",sql);
            console.log("===============");
            con.query(sql,(err,result)=>{
                if (err) throw err;
                resolve(result)
            })
        })
    }
})
const _get=(con=>{
    const model=_getModel();
    return (TB,filter)=>{
        return new Promise(resolve=>{
            const {table_name,fields}=model[TB]
            let Filter=_filterReader(filter,fields);
            let {select,where,limit,order}=Filter;
            if(!where)where=Filter;
            let sql=`select ${select?select:'*'} from ${table_name} ${where} ${order?order:''} ${limit?limit:''}`;
            console.log("===============");
            console.log("SQL:",sql);//
            console.log("===============");
            con.query(sql,(err,result)=>{
                if (err) throw err;
                resolve(result)
            })
        })
    }
})
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
            for(let column in fields){
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
            Add('user',data)    
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
        for(let TB in model){
            const {table_name,fields,data}=model[TB]
            const TBName=table_name||TB
            _CreateTB({TBName,DBName,fields,data,con})
        }
    })
}
const SystemPreparation=({username,password,host},callback)=>{
    const con=_DBConnect({username,password,host},callback)
    // console.log("con:",con)
    const DBName='AccountDB';
    //|===========| Waterline Preparation |=================|//
    Add     =_add(con)
    Edit    =_edit(con)
    Delete  =_delete(con)
    Get     =_get(con)
    //|=====================================================|//
    _CreateDB(con,DBName)
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
            params={};
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
                if(RPath[idx] && RPath[idx].includes(':'))params[RPath[idx].replace(':','')]=path[idx];

            }
            
        }else match=false;
        if(match)return [API[route].api,params,API[route].public]
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
    // console.log("Original",API)
    for(let folder in API){
        const Folder=API[folder]
        for(let file in Folder){
            let {api,route,public}=Folder[file];
            if(!Array.isArray(route)){
                let [method,path]=route.split(' ');
                route=`${method} ${_routeFixer(path)}`
                if(!Route[route])Route[route]={}
                Route[route].api=api
                Route[route].public=public
            }
            else{
                route.map(data=>{
                    let [method,path]=data.split(' ');
                    data=`${method} ${_routeFixer(path)}`
                    if(!Route[data])Route[data]={}
                    Route[data].api=api
                    Route[data].public=public
                })
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
        const {url,method,headers:{authorization}}=req;
        let {pathname,query} = URL.parse(url, true);
        pathname=_routeFixer(pathname)
        const route=`${method.toLocaleLowerCase()} ${pathname.toLocaleLowerCase()}`;
        const [func,params,public]=_routeCaller(API,route);
        // console.log("public",public);console.log("func:",func);
        let access={id:undefined};
        if(!public)access=_token(authorization)
        if(!access.id)return callback(_responseHandler("Unauthorized Access",false))
        _middleware(req,async d=>{
            req.body=d
            req.query=query
            req.params=params
            req.DB={Add,Edit,Delete,Get}
            req.Encrypt=Encrypt
            req.Decrypt=Decrypt
            req.UserID=access.id
            const result=await func(req);
            callback(typeof result==='string'?result:_responseHandler(result,true));
            // const result=func(req,()=>callback(typeof result==='string'?result:_responseHandler(result,true)));
        })        
    }
})

module.exports={Config,GenerateAPI,ServerInput,SystemPreparation,Add,Edit,Delete,Get};