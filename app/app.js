
const express = require("express");

var app = express();
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// Database connection
const db = require('./services/db');

// Add static files location
app.use(express.static("static"));

// Home page route
app.get("/", function(req, res) {
    res.send("Welcome to TalentBridge!");
});

// Hello route
app.get("/hello/:name", function(req, res) {
    console.log(req.params);
    res.send("Hello " + req.params.name);
});

// Test database connection - TalentBridge opportunities
app.get("/db_test", async function(req, res) {
    try {
        const sql = "SELECT * FROM opportunities";
        const results = await db.query(sql);

        console.log(results);

        res.render('opportunities', {
            opportunities: results
        });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Unable to retrieve TalentBridge opportunities.");
    }
});

// Student Dashboard
app.get("/student/dashboard", async function(req, res) {
    try {
        // Get student profile
        const profile = await db.query(`
            SELECT
                u.name,
                u.email,
                sp.education,
                sp.experience,
                sp.location
            FROM users u
            JOIN student_profiles sp
                ON u.user_id = sp.user_id
            WHERE sp.student_id = ?
        `, [1]);

        if (profile.length === 0) {
            return res.status(404).send("Student not found");
        }

        // Get student skills
        const skills = await db.query(`
            SELECT s.skill_name, ss.proficiency
            FROM student_skills ss
            JOIN skills s
                ON ss.skill_id = s.skill_id
            WHERE ss.student_id = ?
        `, [1]);

        // Get recent applications
        const applications = await db.query(`
            SELECT
                o.title,
                a.application_status,
                a.application_date
            FROM applications a
            JOIN opportunities o
                ON a.opportunity_id = o.opportunity_id
            WHERE a.student_id = ?
            ORDER BY a.application_date DESC
        `, [1]);

        // Get skill match recommendations
        const recommendations = await db.query(`
            SELECT
                o.title,
                o.location,
                sm.match_percentage
            FROM skill_matches sm
            JOIN opportunities o
                ON sm.opportunity_id = o.opportunity_id
            WHERE sm.student_id = ?
            ORDER BY sm.match_percentage DESC
        `, [1]);

        res.render("student-dashboard", {
            title: "Student Dashboard",
            student: profile[0],
            skills: skills,
            applications: applications,
            recommendations: recommendations
        });

    } catch (error) {
        console.error("Student dashboard error:", error);
        res.status(500).send("Unable to load student dashboard");
    }
});

// Individual Opportunity Details
app.get("/opportunities/:id", async function(req, res) {
    try {
        const opportunityId = req.params.id;

        const results = await db.query(`
            SELECT
                o.opportunity_id,
                o.title,
                o.description,
                o.location,
                o.deadline,
                o.status,
                e.company_name,
                e.company_description
            FROM opportunities o
            JOIN employer_profiles e
                ON o.employer_id = e.employer_id
            WHERE o.opportunity_id = ?
        `, [opportunityId]);

        if (results.length === 0) {
            return res.status(404).send("Opportunity not found");
        }

        const skills = await db.query(`
            SELECT s.skill_name
            FROM opportunity_skills os
            JOIN skills s
                ON os.skill_id = s.skill_id
            WHERE os.opportunity_id = ?
        `, [opportunityId]);

        res.render("opportunity-details", {
            title: "Opportunity Details",
            opportunity: results[0],
            skills: skills
        });

    } catch (error) {
        console.error("Opportunity details error:", error);
        res.status(500).send("Unable to load opportunity details");
    }
});



// Goodbye route
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Show application form
app.get("/applications/new/:id", async function(req, res) {
    try {
        const opportunityId = req.params.id;

        const results = await db.query(`
            SELECT opportunity_id, title, status
            FROM opportunities
            WHERE opportunity_id = ?
        `, [opportunityId]);

        if (results.length === 0) {
            return res.status(404).send("Opportunity not found");
        }

        if (results[0].status !== "open") {
            return res.status(400).send("This opportunity is closed");
        }

        res.render("application-form", {
            title: "Apply for Opportunity",
            opportunity: results[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Unable to load application form");
    }
});

// Submit student application
app.post("/applications/submit/:id", async function(req, res) {
    try {
        const opportunityId = req.params.id;
        const coverLetter = req.body.cover_letter;

        // Temporary student ID for testing
        const studentId = 1;

        if (!coverLetter || !coverLetter.trim()) {
            return res.status(400).send("Please enter a cover letter");
        }

        const opportunity = await db.query(`
            SELECT opportunity_id
            FROM opportunities
            WHERE opportunity_id = ? AND status = 'open'
        `, [opportunityId]);

        if (opportunity.length === 0) {
            return res.status(400).send("Opportunity is unavailable");
        }

        await db.query(`
            INSERT INTO applications
            (student_id, opportunity_id, cover_letter, application_status, application_date)
            VALUES (?, ?, ?, 'submitted', NOW())
        `, [studentId, opportunityId, coverLetter.trim()]);

        res.redirect("/student/dashboard");

    } catch (error) {
        console.error("Application submission error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).send(
                "You have already applied for this opportunity."
            );
        }

        res.status(500).send("Unable to submit application");
    }
});



// Start server
app.listen(3000, function() {
    console.log("TalentBridge running at http://127.0.0.1:3000/");
});
