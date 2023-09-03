import { Application, Request, Response } from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import moment, { Moment } from "moment";
import dotenv from "dotenv";

dotenv.config();

let dataBaseURL: string = process.env.MONGODB_URL!;
async function connectToDatabase() {
	try {
		await mongoose.connect(dataBaseURL);
		console.log("Successfully Connected to MongoDB");
	} catch (error) {
		console.error("Failed to Connect with MongoDB", error);
	}
}
connectToDatabase();

interface BirthdayInterface {
	name: String;
	birthday: Date;
}

const Schema = new mongoose.Schema({
	name: { type: String, required: true },
	birthday: { type: Date, required: true },
});

const BirthDay = mongoose.model<BirthdayInterface>("Birthday", Schema);
const urlencodeparser = bodyparser.urlencoded({ extended: true });

export default module.exports = (app: Application) => {
	//add
	app.post("/add", urlencodeparser, async (req: Request, res: Response) => {
		try {
			let name: string = req.body.name;
			let birthDate: Moment = moment.utc(req.body.birthday, "DD-MM-YYYY", true);

			if (!name || !birthDate.isValid()) {
				res.setHeader("Content-Type", "application/json");
				res.status(400).json({ error: "Date or Name is invalid" });
			} else {
				let forExistingPerson: BirthdayInterface | null = await BirthDay.findOne({ name: name });
				if (forExistingPerson) {
					res.setHeader("Content-Type", "application/json");
					res.status(409).json({ error: "Person already exists" });
				} else {
					let AddBday = new BirthDay({ name: name, birthday: birthDate.toDate() });

					await AddBday.save();

					res.setHeader("Content-Type", "application/json");
					res.status(201).json({ message: "Birthday Added" });
				}
			}
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			res.status(500).json({ error: "Failed to add Birthday" });
		}
	});

	//delete

	app.delete("/delete/:name", async (req: Request, res: Response) => {
		try {
			let name: string = req.params.name;
			let toDelete: BirthdayInterface | null = await BirthDay.findOneAndDelete({ name: name });

			if (!toDelete) {
				res.setHeader("Content-Type", "application/json");
				res.status(404).json({ error: "Person not found" });
			} else {
				res.setHeader("Content-Type", "application/json");
				res.status(200).json({ message: "Birthday Deleted" });
			}
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			res.status(500).json({ error: "Failed to deleted person" });
		}
	});

	//specific person

	app.get("/:name", async (req: Request, res: Response) => {
		try {
			let name: string = req.params.name;
			let person: BirthdayInterface | null = await BirthDay.findOne({ name: name });

			if (!person) {
				res.setHeader("Content-Type", "application/json");
				res.status(404).json({ error: "Person not found" });
			} else {
				res.setHeader("Content-Type", "application/json");
				res.status(200).json(person);
			}
		} catch (err) {
			res.setHeader("Content-Type", "application/json");
			res.status(500).json({ error: "Could not get Birthday" });
		}
	});

	//update

	app.put("/update/:name", urlencodeparser, async (req: Request, res: Response) => {
		try {
			let name: string = req.params.name;
			let newBirthday: Moment = moment.utc(req.body.birthday, "DD-MM-YYYY", true);

			if (!newBirthday.isValid()) {
				res.setHeader("Content-Type", "application/json");
				res.status(400).json({ error: "Date format is not correct" });
			} else {
				let updatedBday: BirthdayInterface | null = await BirthDay.findOneAndUpdate(
					{ name: name },
					{ birthday: newBirthday.toDate() },
					{ new: true }
				);
				if (!updatedBday) {
					res.setHeader("Content-Type", "application/json");
					res.status(404).json({ error: "Person not found" });
				} else {
					res.setHeader("Content-Type", "application/json");
					res.status(200).json({ message: "Birthday updated" });
				}
			}
		} catch (error) {
			res.setHeader("Content-Type", "application/json");
			res.status(500).json({ error: "Failed to update birthday" });
		}
	});

	// closest birthday

	app.get("/birthday/nearest", async (req: Request, res: Response) => {
		try {
			let today: Moment = moment.utc().startOf("day");
			let allBirthday: BirthdayInterface[] = await BirthDay.find();
			let closestBirthday: null | BirthdayInterface | null = null;
			let minimunDifference = Infinity;
			allBirthday.forEach((bday: BirthdayInterface) => {
				let cbday: Moment = moment(bday.birthday);
				cbday.year(today.year());

				if (cbday.isBefore(today)) {
					cbday.add(1, "year");
				}
				let absoluteDifference: number = Math.abs(cbday.diff(today, "days"));
				if (absoluteDifference < minimunDifference) {
					minimunDifference = absoluteDifference;
					closestBirthday = bday;
				}
			});
			if (!closestBirthday) {
				res.setHeader("Content-Type", "application/json");
				res.status(404).json({ error: "No closest birthday found" });
			} else {
				res.setHeader("Content-Type", "application/json");
				res.status(200).json(closestBirthday);
			}
		} catch (err) {
			res.setHeader("Content-Type", "application/json");
			res.status(500).json({ error: "Could not fetch nearest birthday" });
		}
	});
};
