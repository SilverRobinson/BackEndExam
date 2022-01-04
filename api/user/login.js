const api=async req=>{console.log("login")
    const {body:{username,password},DB:{Get},Encrypt}=req
    const result=await Get('user',{username,password})
    console.log("Result:",result);
    const {id}=result[0],session=Encrypt({data:id,key:'key'})+'-'+Math.floor(Math.random()*1000000);
    let str=JSON.stringify({id,session});
    return {token:Encrypt({data:str,key:'key'})}
}
const route='post /login';
const public=true;
module.exports={api,route,public}