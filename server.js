const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Homepage
app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/index.html");
});

// Admin page
app.get("/admin", (req,res)=>{
    res.sendFile(__dirname + "/admin.html");
});

// SETTINGS ROUTES

app.get("/settings",(req,res)=>{
    res.sendFile(__dirname + "/settings.json");
});

app.post("/settings",(req,res)=>{
    fs.writeFileSync("settings.json", JSON.stringify(req.body,null,2));
    res.send({status:"saved"});
});

// JOB API

const countryCodeMap={
    "India":"in",
    "United States":"us",
    "United Kingdom":"gb",
    "Australia":"au",
    "Canada":"ca"
};

app.get("/api/jobs", async(req,res)=>{

    const role=req.query.role||"Business Analyst";
    const country=req.query.country||"India";
    const page=req.query.page||1;
    const modeFilter=req.query.mode||"All";

    const countryCode=countryCodeMap[country]||"in";
    const url=`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;

    try{

        const response=await axios.get(url,{
            params:{
                app_id:process.env.APP_ID,
                app_key:process.env.APP_KEY,
                what:role,
                results_per_page:12
            }
        });

        let jobs=response.data.results.map(job=>{

            let mode="Office";
            const desc=job.description?.toLowerCase()||"";

            if(desc.includes("remote") && !desc.includes("hybrid")) mode="WFH";
            else if(desc.includes("hybrid")) mode="Hybrid";

            return{
                title:job.title||"Not specified",
                company:job.company?.display_name||"Not specified",
                salary:job.salary_average||"Not specified",
                mode:mode,
                source:job.redirect_url||"#",
                country:job.location?.area[0]||"",
                state:job.location?.area[1]||""
            };
        });

        if(modeFilter!=="All"){
            jobs=jobs.filter(j=>j.mode===modeFilter);
        }

        res.json(jobs);

    }catch(err){
        console.error(err.message);
        res.status(500).json({error:"Error fetching jobs"});
    }

});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log(`Server running on ${PORT}`));
