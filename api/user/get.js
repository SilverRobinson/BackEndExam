const api=async req=>{
    let {params:{id},DB:{Get}}=req
    const result=id?await Get('user',{id}):await Get('user')
    return {data:result}
}
const route=['get /user','get /user/:id'];
module.exports={api,route}