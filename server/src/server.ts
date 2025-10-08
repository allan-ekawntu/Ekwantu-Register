import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increase limit for photo data

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000, // 5 seconds
});

// Function to create the table if it doesn't exist
const createTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS visitors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                surname VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                visitor_phone_number VARCHAR(50),
                photo TEXT,
                reason_for_visit TEXT,
                host VARCHAR(255),
                date VARCHAR(50),
                time_in VARCHAR(50),
                agreement_signed BOOLEAN,
                time_out VARCHAR(50)
            );
        `);
        console.log('Table "visitors" is ready.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        client.release();
    }
};

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1'); // Simple query to check DB connection
        res.status(200).json({ status: 'ok', message: 'Database connection successful.' });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(503).json({ status: 'error', message: 'Failed to connect to the database.' });
    }
});

app.get('/api/visitors', async (req, res) => {
    try {
        // Note the aliasing to match frontend camelCase expectations
        const result = await pool.query('SELECT id, name, surname, company, visitor_phone_number as "visitorPhoneNumber", photo, reason_for_visit as "reasonForVisit", host, date, time_in as "timeIn", agreement_signed as "agreementSigned", time_out as "timeOut" FROM visitors ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching visitors:', err);
        res.status(500).json({ message: 'Failed to fetch visitors.' });
    }
});

app.post('/api/visitors', async (req, res) => {
    const {
        name,
        surname,
        company,
        visitorPhoneNumber,
        photo,
        reasonForVisit,
        host,
        date,
        timeIn,
        agreementSigned,
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO visitors (name, surname, company, visitor_phone_number, photo, reason_for_visit, host, date, time_in, agreement_signed)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [name, surname, company, visitorPhoneNumber, photo, reasonForVisit, host, date, timeIn, agreementSigned]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Visitor signed in successfully.' });
    } catch (err) {
        console.error('Error inserting visitor:', err);
        res.status(500).json({ message: 'Failed to sign in visitor.' });
    }
});

app.post('/api/visitors/schedule', async (req, res) => {
    const { name, surname, company, host, reasonForVisit, date } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO visitors (name, surname, company, host, reason_for_visit, date, agreement_signed)
             VALUES ($1, $2, $3, $4, $5, $6, false)
             RETURNING *`,
            [name, surname, company, host, reasonForVisit, date]
        );
        // Note: Aliasing columns to match frontend camelCase expectations
        const newVisitor = {
            ...result.rows[0],
            visitorPhoneNumber: result.rows[0].visitor_phone_number,
            reasonForVisit: result.rows[0].reason_for_visit,
            timeIn: result.rows[0].time_in,
            agreementSigned: result.rows[0].agreement_signed,
            timeOut: result.rows[0].time_out,
        };
        res.status(201).json(newVisitor);
    } catch (err) {
        console.error('Error scheduling visitor:', err);
        res.status(500).json({ message: 'Failed to schedule visitor.' });
    }
});

app.put('/api/visitors/:id/log-arrival', async (req, res) => {
    const { id } = req.params;
    const { timeIn, date } = req.body;
    try {
        const result = await pool.query(
            'UPDATE visitors SET time_in = $1, date = $2, agreement_signed = true WHERE id = $3 RETURNING *',
            [timeIn, date, id]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Visitor not found.' });
        }
    } catch (err) {
        console.error('Error logging visitor arrival:', err);
        res.status(500).json({ message: 'Failed to log visitor arrival.' });
    }
});

app.put('/api/visitors/:id/signout', async (req, res) => {
    const { id } = req.params;
    const { timeOut } = req.body;
    try {
        const result = await pool.query(
            'UPDATE visitors SET time_out = $1 WHERE id = $2 RETURNING *',
            [timeOut, id]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Visitor not found.' });
        }
    } catch (err) {
        console.error('Error signing out visitor:', err);
        res.status(500).json({ message: 'Failed to sign out visitor.' });
    }
});

app.put('/api/visitors/:id', async (req, res) => {
    const { id } = req.params;
    const { name, surname, company, host } = req.body; // Editable fields
    try {
        const result = await pool.query(
            'UPDATE visitors SET name = $1, surname = $2, company = $3, host = $4 WHERE id = $5 RETURNING *',
            [name, surname, company, host, id]
        );
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Visitor not found.' });
        }
    } catch (err) {
        console.error('Error updating visitor:', err);
        res.status(500).json({ message: 'Failed to update visitor.' });
    }
});

app.delete('/api/visitors/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM visitors WHERE id = $1', [id]);
        if ((result.rowCount ?? 0) > 0) {
            res.status(204).send(); // No Content
        } else {
            res.status(404).json({ message: 'Visitor not found.' });
        }
    } catch (err) {
        console.error('Error deleting visitor:', err);
        res.status(500).json({ message: 'Failed to delete visitor.' });
    }
});

app.listen(port, async () => {
    await createTable();
    console.log(`Server running on http://localhost:${port}`);
});

