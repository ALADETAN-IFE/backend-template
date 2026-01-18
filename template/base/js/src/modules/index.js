const { Router } = require("express");
const V1Routes = require("./v1");

const router = Router();

router.use("/v1", V1Routes);

module.exports = router;
