const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');


mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDb = async() => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '6180fe02802b4d2f7479c8a4',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iure explicabo et distinctio voluptates in adipisci expedita. Dicta reprehenderit similique odio ducimus dolorem, at sequi quaerat aspernatur adipisci voluptatem quasi quam!',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images:  [
                {
                  url: 'https://res.cloudinary.com/dsedlkptk/image/upload/v1636073995/YelpCamp/rvw688oddurlfucyoqll.jpg',
                  filename: 'YelpCamp/rvw688oddurlfucyoqll'
                },
                {
                  url: 'https://res.cloudinary.com/dsedlkptk/image/upload/v1636073996/YelpCamp/xshb781jwjabtbvy1jld.jpg',
                  filename: 'YelpCamp/xshb781jwjabtbvy1jld'
                }
              ]
        })
         await camp.save(); 
    }  
}

seedDb().then(() => {
    mongoose.connection.close();
})