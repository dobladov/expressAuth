const mongoose = require('mongoose')

const RouteSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    required: true,
  },
  permissions: {
    type: Array,
    required: true,
  }
})

const RoutesSchema = new mongoose.Schema({
  routes: {
    type: [RouteSchema],
    default: []
  }
})

RoutesSchema.statics.getRoutes = async () => {
  try {
    return await Routes.findOne({}).exec()
  } catch (error) {
    throw error
  }
}

RoutesSchema.statics.setRoutes = async (routes) => {
  try {
    const routesObj = await Routes.findOne({}).exec()
    return await Routes.findByIdAndUpdate(routesObj._id, {routes}).exec()
  } catch (error) {
    throw error
  }
}

const Routes = mongoose.model('Routes', RoutesSchema)
module.exports = Routes