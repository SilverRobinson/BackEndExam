const api=async req=>{
    const {body,DB:{Add,Get}}=req
    const rec=await Get('user',{username:body.username});
    if(rec.length>0)return {data:"Username is already exist"};
    const result=await Add('user',body)
    if(result.serverStatus===2)return {data:"Successfully Saved"}
    return "Ok" 
}
const route='post /user';
module.exports={api,route}