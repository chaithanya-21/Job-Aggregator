const express=require("express");
const axios=require("axios");
const cors=require("cors");
const fs=require("fs");
const PDFDocument=require("pdfkit");
require("dotenv").config();

const app=express();
app.use(cors());
app.use(express.json({limit:"10mb"}));
app.use(express.static(__dirname));

app.get("/",(req,res)=>res.sendFile(__dirname+"/index.html"));

/* JOB FETCH */
app.get("/api/jobs",async(req,res)=>{
    const role=req.query.role||"Business Analyst";
    const page=req.query.page||1;

    try{
        const r=await axios.get(`https://api.adzuna.com/v1/api/jobs/in/search/${page}`,{
            params:{
                app_id:process.env.APP_ID,
                app_key:process.env.APP_KEY,
                what:role,
                results_per_page:10
            }
        });

        const jobs=r.data.results.map(j=>({
            title:j.title,
            company:j.company?.display_name||"",
            salary:j.salary_average||"Not specified",
            skills:j.description?.substring(0,140)||"",
            description:j.description?.substring(0,500)||"",
            source:j.redirect_url,
            location:`${j.location?.area[1]||""}, ${j.location?.area[0]||""}`,
            logo:`https://logo.clearbit.com/${(j.redirect_url||"google.com").replace(/^https?:\/\//,'').split('/')[0]}`
        }));

        res.json(jobs);
    }catch(e){
        res.status(500).json({error:"jobs failed"});
    }
});

/* TRUE RESUME OPTIMIZER */
app.post("/optimize",async(req,res)=>{
    try{
        const {resumeText,jobDesc,skills}=req.body;

        const ai=await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model:"gpt-4o-mini",
                messages:[
                    {
                        role:"system",
                        content:"Rewrite resumes professionally. Keep formatting logical. Improve bullets with job keywords. Maintain ATS compatibility."
                    },
                    {
                        role:"user",
                        content:`Resume:\n${resumeText}\n\nJob:\n${jobDesc}\n\nSkills:\n${skills}`
                    }
                ]
            },
            {headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`}}
        );

        const optimized=ai.data.choices[0].message.content;

        const doc=new PDFDocument();
        const path=`optimized_${Date.now()}.pdf`;
        doc.pipe(fs.createWriteStream(path));
        doc.fontSize(11).text(optimized,{width:450});
        doc.end();

        setTimeout(()=>res.download(path),800);

    }catch(e){
        res.status(500).json({error:"optimization failed"});
    }
});

/* CHAT */
app.post("/chat",async(req,res)=>{
    try{
        const r=await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model:"gpt-4o-mini",
                messages:req.body.messages
            },
            {headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`}}
        );
        res.json(r.data);
    }catch(e){
        res.status(500).json({error:"chat failed"});
    }
});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log("Server running",PORT));
