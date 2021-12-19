const api=req=>{
    const {body,params,query}=req
    console.log("edit user")
    
    return {body,params,query}
}
const route='patch /user/:id';
module.exports={api,route}