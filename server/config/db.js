const mongoose = require('mongoose');

const connectDb = async () => {
    try{
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect(process.env.MONGO_DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`Database connected ${conn.connection.host}`)
    }catch(error){
        console.log(error)
    }
}

 
module.exports = connectDb;
 