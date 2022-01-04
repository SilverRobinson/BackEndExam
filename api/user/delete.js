const api=async req=>{
    let {params:{id},DB:{Delete,Get},UserID,body:{ids}}=req
    if(id){
        const rec=await Get('user',{id});
        if(rec.length===0)return {data:"Record is either not exist or already removed"};
        if(Number(id)===Number(UserID))return {data:"You are not allowed to removed a user who is currently login"};
        const result=await Delete('user',{id})
    }
    else{
        ids=ids.map(data=>Number(data))
        if(ids.includes(Number(UserID)))return {data:"You are not allowed to removed a user who is currently login"};
        const result=await Delete('user',{id:ids,status:"New"})
        return {data:"Successfully Removed"}
    }
    return "Ok" 
}
const route=['delete /user/:id','delete /user/'];
module.exports={api,route}