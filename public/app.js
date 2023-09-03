"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const birthayController_1 = __importDefault(require("./controller/birthayController"));
const PORT = 3000;
var app = (0, express_1.default)();
(0, birthayController_1.default)(app);
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
});
