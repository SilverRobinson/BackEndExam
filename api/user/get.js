const api=async req=>{
    let {params:{id},DB:{Get}}=req
    const result=id?await Get('user',{id,status:"New"}):await Get('user',{status:"New"})
    return {data:result}
}
const route=['get /user','get /user/:id'];
module.exports={api,route}