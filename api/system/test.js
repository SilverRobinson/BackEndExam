const api=async req=>{
    let {DB:{Get}}=req

    const result=await Get('user',{where:{id:[1,2,3],status:{"!=":"Removed"}},select:['id','first_name','username'],order:{id:"desc"},limit:'0,2'})
    // const result=await Get('user',{where:{id:[1,2,3],status:{"!=":"Removed"},username:"admin"},select:['id','first_name','username']})
    // const result=await Get('user',{where:{id:[1,2,3],status:{"!=":"Removed"},username:"admin"}})
    // const result=await Get('user',{id:[1,2,3],status:{"!=":"Removed"}})
    // const result=await Get('user',{id:[1,2,3]})
    return {data:result}
}
const route=['get /test'];
module.exports={api,route}