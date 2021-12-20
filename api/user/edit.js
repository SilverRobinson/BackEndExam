const api=async req=>{
    let {params:{id},DB:{Get,Edit},body}=req
    body.username=undefined;
    const rec=await Get('user',{id});
    if(rec.length===0)return {data:"Record is not found"};
    const result=await Edit('user',body,{id})
    if(result.serverStatus===2)return {data:"Successfully Saved"}
    return "Ok" 
}
const route='patch /user/:id';
module.exports={api,route}