const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req,res)=>res.sendFile(__dirname+"/index.html"));

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

    const countryCode=countryCodeMap[country]||"in";
    const url=`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;

    try{

        const response=await axios.get(url,{
            params:{
                app_id:process.env.APP_ID,
                app_key:process.env.APP_KEY,
                what:role,
                results_per_page:10
            }
        });

        const jobs=response.data.results.map(job=>({

            title:job.title||"",
            company:job.company?.display_name||"",
            salary:job.salary_average||"Not specified",
            skills:job.description?.substring(0,120)||"",
            description:job.description?.substring(0,500)||"",
            source:job.redirect_url||"#",
            location:`${job.location?.area[1]||""}, ${job.location?.area[0]||""}`

        }));

        res.json(jobs);

    }catch(err){
        console.error(err.message);
        res.status(500).json({error:"Error fetching jobs"});
    }
});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log("Server running on",PORT));
