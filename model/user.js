module.exports={
    table_name:'user',
    fields:{
        id:         {   type:'int',             allowNull:false,        autoInc:true    ,primary:true},
        first_name: {   type:'VARCHAR(25)',     allowNull:false, },
        last_name:  {   type:'VARCHAR(25)',     allowNull:false, },
        address:    {   type:'VARCHAR(250)',    allowNull:false, },
        postal:     {   type:'VARCHAR(4)',      allowNull:false, },
        contact:    {   type:'VARCHAR(25)',     allowNull:false, },
        email:      {   type:'VARCHAR(50)',     allowNull:false, },
        username:   {   type:'VARCHAR(25)',     allowNull:false, },
        password:   {   type:'VARCHAR(100)',    allowNull:false,        encrypt:true},
        status:     {   type:'VARCHAR(25)',     default:"New"}

    },
    data:[{
        first_name  : "Admin",
        last_name   : "User",
        address     : "Sample Address",
        postal      : "1234",
        contact     : "Sample Contact",
        email       : "Sample Email",
        username    : "admin",
        password    : "12345",
    }]
}