const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function validateDataFields(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  if (!deliverTo) {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
  if (!mobileNumber) {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
  if (!dishes) {
    return next({
      status: 400,
      message: "Order must include a dish",
    });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "The 'dishes' field needs to be an array",
    });
  }
  next();
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!status) {
    return next({
      status: 400,
      message: "A 'status' field is required",
    });
  }
  if (!validStatus.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-deliver, or delivered",
    });
  }
  if (status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

// function create(req, res) {
//   const { data: { deliverTo, mobileNumber, dishes:} = {} } = req.body;

// }

module.exports = {
  list,
  //create: [validateDataFields, validateQuantity, create]
};
