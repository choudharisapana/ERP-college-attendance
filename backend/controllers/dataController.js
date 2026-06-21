const Data = require("../models/DataModel");

exports.getAllData = async (req, res) => {
  try {
    const data = await Data.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createData = async (req, res) => {
  try {
    await Data.deleteMany({});
    const newData = await Data.create(req.body);
    res.status(201).json(newData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};