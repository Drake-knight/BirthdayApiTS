"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let dataBaseURL = process.env.MONGODB_URL;
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(dataBaseURL);
            console.log("Successfully Connected to MongoDB");
        }
        catch (error) {
            console.error("Failed to Connect with MongoDB", error);
        }
    });
}
connectToDatabase();
const Schema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    birthday: { type: Date, required: true },
});
const BirthDay = mongoose_1.default.model("Birthday", Schema);
const urlencodeparser = body_parser_1.default.urlencoded({ extended: true });
exports.default = module.exports = (app) => {
    //add
    app.post("/add", urlencodeparser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let name = req.body.name;
            let birthDate = moment_1.default.utc(req.body.birthday, "DD-MM-YYYY", true);
            if (!name || !birthDate.isValid()) {
                res.setHeader("Content-Type", "application/json");
                res.status(400).json({ error: "Date or Name is invalid" });
            }
            else {
                let forExistingPerson = yield BirthDay.findOne({ name: name });
                if (forExistingPerson) {
                    res.setHeader("Content-Type", "application/json");
                    res.status(409).json({ error: "Person already exists" });
                }
                else {
                    let AddBday = new BirthDay({ name: name, birthday: birthDate.toDate() });
                    yield AddBday.save();
                    res.setHeader("Content-Type", "application/json");
                    res.status(201).json({ message: "Birthday Added" });
                }
            }
        }
        catch (error) {
            res.setHeader("Content-Type", "application/json");
            res.status(500).json({ error: "Failed to add Birthday" });
        }
    }));
    //delete
    app.delete("/delete/:name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let name = req.params.name;
            let toDelete = yield BirthDay.findOneAndDelete({ name: name });
            if (!toDelete) {
                res.setHeader("Content-Type", "application/json");
                res.status(404).json({ error: "Person not found" });
            }
            else {
                res.setHeader("Content-Type", "application/json");
                res.status(200).json({ message: "Birthday Deleted" });
            }
        }
        catch (error) {
            res.setHeader("Content-Type", "application/json");
            res.status(500).json({ error: "Failed to deleted person" });
        }
    }));
    //specific person
    app.get("/:name", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let name = req.params.name;
            let person = yield BirthDay.findOne({ name: name });
            if (!person) {
                res.setHeader("Content-Type", "application/json");
                res.status(404).json({ error: "Person not found" });
            }
            else {
                res.setHeader("Content-Type", "application/json");
                res.status(200).json(person);
            }
        }
        catch (err) {
            res.setHeader("Content-Type", "application/json");
            res.status(500).json({ error: "Could not get Birthday" });
        }
    }));
    //update
    app.put("/update/:name", urlencodeparser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let name = req.params.name;
            let newBirthday = moment_1.default.utc(req.body.birthday, "DD-MM-YYYY", true);
            if (!newBirthday.isValid()) {
                res.setHeader("Content-Type", "application/json");
                res.status(400).json({ error: "Date format is not correct" });
            }
            else {
                let updatedBday = yield BirthDay.findOneAndUpdate({ name: name }, { birthday: newBirthday.toDate() }, { new: true });
                if (!updatedBday) {
                    res.setHeader("Content-Type", "application/json");
                    res.status(404).json({ error: "Person not found" });
                }
                else {
                    res.setHeader("Content-Type", "application/json");
                    res.status(200).json({ message: "Birthday updated" });
                }
            }
        }
        catch (error) {
            res.setHeader("Content-Type", "application/json");
            res.status(500).json({ error: "Failed to update birthday" });
        }
    }));
    // closest birthday
    app.get("/birthday/nearest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let today = moment_1.default.utc().startOf("day");
            let allBirthday = yield BirthDay.find();
            let closestBirthday = null;
            let minimunDifference = Infinity;
            allBirthday.forEach((bday) => {
                let cbday = (0, moment_1.default)(bday.birthday);
                cbday.year(today.year());
                if (cbday.isBefore(today)) {
                    cbday.add(1, "year");
                }
                let absoluteDifference = Math.abs(cbday.diff(today, "days"));
                if (absoluteDifference < minimunDifference) {
                    minimunDifference = absoluteDifference;
                    closestBirthday = bday;
                }
            });
            if (!closestBirthday) {
                res.setHeader("Content-Type", "application/json");
                res.status(404).json({ error: "No closest birthday found" });
            }
            else {
                res.setHeader("Content-Type", "application/json");
                res.status(200).json(closestBirthday);
            }
        }
        catch (err) {
            res.setHeader("Content-Type", "application/json");
            res.status(500).json({ error: "Could not fetch nearest birthday" });
        }
    }));
};
