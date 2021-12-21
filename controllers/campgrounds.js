const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { cloudinary } = require('../cloudinary');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    // const campgrounds = await Campground.find({});
    // res.render('campgrounds/index', { campgrounds });

    let currentPage = Number(req.query.page);
    console.log({
        currentPage
    });

    if (!currentPage || currentPage < 1)
    // if client req /index w/o ?page 
    {
        currentPage = 1;
        // get campgrounds from the database
        req.session.campgrounds = await Campground.find({}).limit(1000);

        // Initialize Pagination
        let len = (req.session.campgrounds).length;
        req.session.pagination = {
            totalItems: len, // total # of campgrounds
            itemsPerPage: 12,
            totalPages: Math.ceil(len / 12) // total # of pages
        }
    }

    if (!req.session.pagination || !req.session.campgrounds) res.redirect('campgrounds/');

    const {
        itemsPerPage,
        totalItems,
        totalPages
    } = req.session.pagination;
    let start = (currentPage - 1) * itemsPerPage;
    let end = currentPage * itemsPerPage;
    if (end > totalItems) end = totalItems;

    const campgrounds = (req.session.campgrounds);
    res.render('campgrounds/', {
        campgrounds,
        totalPages,
        currentPage,
        start,
        end
    });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
    req.flash('success', 'Successfully made a new Campground!');
    res.redirect(`campgrounds/${campground._id}`);
}

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that Campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
        req.flash('error', 'Cannot find that Campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const newLocation = req.body.campground.location;
    // if Location was changed
    if (newLocation !== campground.location) {
        const geoData = await geocoder.forwardGeocode({
            query: newLocation,
            limit: 1
        }).send();
        campground.geometry = geoData.body.features[0].geometry;
        console.log(campground.geometry);
    }

    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    req.flash('success', 'Successfully updated Campground!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully Deleted Campground!');
    res.redirect('/campgrounds');
}