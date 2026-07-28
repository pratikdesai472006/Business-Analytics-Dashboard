const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/paymentController");
router.use(auth);
router.get("/", c.listOrders);
router.post("/", c.createOrder);
router.patch("/:id/status", c.updateOrderStatus);
router.get("/:id/receipt", c.receipt);
module.exports = router;
