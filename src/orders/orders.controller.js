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
  res.locals.dishes = dishes;
  next();
}

function validateQuantity(req, res, next) {
  const { dishes } = res.locals;
  for ([index, dish] of dishes.entries()) {
    if (
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      dish.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
  next();
}

function validateStatusDelete(req, res, next) {
  const { status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "Cannot delete an order that is not pending",
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

function validateId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (orderId !== id) {
    if (id === "" || id === null || id === undefined) {
      next();
    }
    return next({
      status: 400,
      message: `Body id does not match route id: ${id}, ${orderId}`,
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: [{ id, name, description, image_url, price, quantity }] = [],
    } = {},
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: [{ id, name, description, image_url, price, quantity }],
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const { order } = res.locals;
  const { orderId } = req.params;
  const {
    data: {
      deliverTo,
      mobileNumber,
      status,
      dishes: [{ id, name, description, image_url, price, quantity }] = [],
    } = {},
  } = req.body;
  const updateOrder = {
    ...order,
    deliverTo,
    mobileNumber,
    status,
    dishes: [{ id, name, description, image_url, price, quantity }],
  };
  const index = orders.findIndex((order) => order.id === orderId);
  orders[index] = updateOrder;
  res.status(200).json({ data: updateOrder });
}
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // `splice()` returns an array of the deleted elements, even if it is one element
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateDataFields, validateQuantity, create],
  read: [orderExists, read],
  update: [
    orderExists,
    validateId,
    validateDataFields,
    validateQuantity,
    validateStatus,
    update,
  ],
  delete: [orderExists, validateStatusDelete, destroy],
};
