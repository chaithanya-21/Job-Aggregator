const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();
app.use(cors());

const countryCodeMap = {
    "India": "in",
    "United States": "us",
    "United Kingdom": "gb",
    "Australia": "au",
    "Canada": "ca"
};

app.get("/api/jobs", async (req, res) => {

    const role = req.query.role || "Business Analyst";
    const country = req.query.country || "India";
    const page = req.query.page || 1;
    const modeFilter = req.query.mode || "All";

    const countryCode = countryCodeMap[country] || "in";
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;

    try {

        const response = await axios.get(url, {
            params: {
                app_id: process.env.APP_ID,
                app_key: process.env.APP_KEY,
                what: role,
                results_per_page: 12
            }
        });

        let jobs = response.data.results.map(job => {

            let mode = "Office";
            const desc = job.description?.toLowerCase() || "";

            if (desc.includes("remote") && !desc.includes("hybrid")) mode = "WFH";
            else if (desc.includes("hybrid")) mode = "Hybrid";

            return {
                title: job.title || "Not specified",
                company: job.company?.display_name || "Not specified",
                salary: job.salary_average || "Not specified",
                skills: job.description?.substring(0,160) || "Not specified",
                mode: mode,
                posted: job.created || "Not specified",
                source: job.redirect_url || "#",
                country: job.location?.area[0] || "Not specified",
                state: job.location?.area[1] || "Not specified"
            };
        });

        // 🔹 Mode filter logic
        if(modeFilter !== "All"){
            jobs = jobs.filter(j => j.mode === modeFilter);
        }

        res.json(jobs);

    } catch(error){
        console.error(error.response?.data || error.message);
        res.status(500).send({ error:"Error fetching jobs" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
