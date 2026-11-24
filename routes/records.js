const router = require("express").Router();
const pool = require("../db");

const STATUSES = ["Pending", "In progress", "Completed"];
const COLUMNS = "id, title, category, description, status";

// Returns a positive whole number, or null if the id is not valid
function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const n = Number(value);
  return n <= 2147483647 ? n : null;
}

// Checks the four editable fields. Returns { value } or { error }
function validateBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }
  const clean = {};
  const rules = [
    ["title", "Title", 3, 80],
    ["category", "Category", 2, 40],
    ["description", "Description", 5, 300]
  ];
  for (const [field, label, min, max] of rules) {
    const raw = body[field];
    if (typeof raw !== "string") {
      return { error: `${label} is required and must be text.` };
    }
    const text = raw.trim();
    if (text.length < min || text.length > max) {
      return { error: `${label} must have ${min} to ${max} characters.` };
    }
    clean[field] = text;
  }
  if (typeof body.status !== "string") {
    return { error: "Status is required and must be text." };
  }
  const status = body.status.trim();
  if (!STATUSES.includes(status)) {
    return { error: "Status must be Pending, In progress or Completed." };
  }
  clean.status = status;
  return { value: clean };
}

const badId = { message: "Id must be a positive whole number." };
const notFound = { message: "Record not found." };

// GET all
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET one
router.get("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json(badId);

    const result = await pool.query(
      `SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]
    );
    if (result.rowCount === 0) return res.status(404).json(notFound);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST (create)
router.post("/", async (req, res, next) => {
  try {
    const checked = validateBody(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });

    const { title, category, description, status } = checked.value;
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [title, category, description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT (update)
router.put("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json(badId);

    const checked = validateBody(req.body);
    if (checked.error) return res.status(400).json({ message: checked.error });

    const { title, category, description, status } = checked.value;
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5 RETURNING ${COLUMNS}`,
      [title, category, description, status, id]
    );
    if (result.rowCount === 0) return res.status(404).json(notFound);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json(badId);

    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id", [id]
    );
    if (result.rowCount === 0) return res.status(404).json(notFound);
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;