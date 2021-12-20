const api=async req=>{
    const {params:{id},DB:{Delete,Get}}=req
    const rec=await Get('user',{id});
    if(rec.length===0)return {data:"Record is either not exist or already removed"};
    const result=await Delete('user',{id})
    if(result.serverStatus===2)return {data:"Successfully Removed"}
    return "Ok" 
}
const route='delete /user/:id';
module.exports={api,route}