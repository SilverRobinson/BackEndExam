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
        password:   {   type:'VARCHAR(100)',    allowNull:false, }

    },
    data:[{
        first_name  : "Admin",
        last_name   : "User",
        address     : "Sample Address",
        postal      : "Sample Postal",
        contact     : "Sample Contact",
        email       : "Sample Email",
        username    : "admin",
        password    : ""
    }]
}

//REATE TABLE `accountdb`.`test2` ( `id` INT NULL ) ENGINE = InnoDB;
//CREATE TABLE `accountdb`.`test` 
//( `id` INT NOT NULL AUTO_INCREMENT ,
// `name` VARCHAR(25) NOT NULL ,
// `date` DATE NOT NULL ,
// `status` VARCHAR(25) NOT NULL DEFAULT 'New' ,
// `amount` DOUBLE NOT NULL , PRIMARY KEY (`id`))
// ENGINE = InnoDB;