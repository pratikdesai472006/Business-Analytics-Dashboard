const router = require("express").Router();
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/datasetController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.originalname.toLowerCase().endsWith(".csv")) return callback(null, true);
    return callback(new Error("Only CSV files are supported."));
  },
});

const uploadCsv = (req, res, next) =>
  upload.single("file")(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    return controller.uploadCsv(req, res, next);
  });

router.use(auth);
router.get("/", controller.list);
router.get("/active", controller.active);
router.get("/active/analytics", controller.analytics);
router.post("/upload", uploadCsv);
router.post("/manual", controller.createManual);
router.patch("/:id/activate", controller.activate);
router.patch("/:id/rename", controller.rename);
router.delete("/:id", controller.remove);
router.get("/:id/rows", controller.rows);
router.get("/:id/file", controller.file);
router.get("/:id/export", controller.exportCsv);

module.exports = router;
