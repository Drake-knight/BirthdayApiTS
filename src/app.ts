import express from "express";
import controller from "./controller/birthayController";
const PORT = 3000;
var app = express();
controller(app);

app.listen(PORT, () => {
	console.log(`Listening to port ${PORT}`);
});
