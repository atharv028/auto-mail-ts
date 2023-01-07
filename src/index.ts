import "dotenv/config";
import "datejs";
import * as Express from "express";
import bodyParser from "body-parser";
import { Agenda, AgendaConfig } from "agenda";
import { MongoClient, MongoClientOptions, ServerApiVersion } from "mongodb";
import processMail from "./jobs/schedule_mail.js";
import { randomInt } from "crypto";

const app = Express.default();
const port = process.env.PORT || 4000;
const agenda = new Agenda(<AgendaConfig>{
  processEvery: "1 minute",
  db: { address: process.env.MONGO_URI, collection: "agendaJobs" },
});
const client = new MongoClient(process.env.MONGO_URI, <MongoClientOptions>{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port, () => console.log(`Listening to port ${port}`));

const scheduleMailFun = async (
  jobId: string,
  timeStart: string,
  bodyHtml: string,
  subject: string,
  emails: string[],
  toEmails: string[],
  senderMail: string,
  senderPass: string
) => {
  const job = agenda.create(jobId, async (job) => {
    await processMail(
      emails,
      toEmails,
      bodyHtml,
      subject,
      senderMail,
      senderPass,
      jobId
    ).catch((err) => console.log(err));
  });
  const date = new Date(Date.parse(timeStart));
  const hour = date.getHours();
  const min = date.getMinutes();
  console.log(`${min} ${hour}`);
  job.repeatEvery(`${min} ${hour} * * 0-6`, {
    timezone: "Asia/Kolkata",
    startDate: new Date(),
    skipImmediate: true,
  });
  await job.save();
  console.log(job);
  await client.db("emails").collection(senderMail).insertOne({
    jobId: jobId,
    currIndex: 0,
    completedList: [],
    totalList: emails,
  });
};

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/scheduleEmail", async (req, res) => {
  const senderMail = req.body.senderMail;
  const senderPass = req.body.senderPass;
  const bodyHtml = req.body.body;
  const subject = req.body.subject;
  const toEmails = req.body.toEmails;
  const emails = req.body.emails;
  const timeStart = req.body.startTime;

  try {
    console.log(`${senderMail} ${senderPass} ${emails.length}`);
    const jobId = `mailer-${randomInt(100000)}`;

    await scheduleMailFun(
      jobId,
      timeStart,
      bodyHtml,
      subject,
      emails,
      toEmails,
      senderMail,
      senderPass
    );
    res.send({ status: 200, message: "Scheduled Successfully", jobId: jobId });
  } catch (err) {
    res.send({ status: 400, message: "Error Occured" });
  }
});

app.get("/getJobs", async (req, res) => {
  const uid = req.query.senderMail as string;
  const jobs = await client.db("emails").collection(uid).findOne();
  console.log(jobs);
  if (jobs === null || jobs.currIndex === null) {
    res.send({
      status: 200,
      jobsList: [],
      message: `No Jobs Scheduled for the mail ${uid}`,
    });
  } else {
    try {
      const remainingCount =
        parseInt(jobs.totalList.length) - parseInt(jobs.completedList.length);
      res.send({
        status: 200,
        jobId: jobs.jobId,
        completedMails: jobs.completedList,
        totalList: jobs.totalList,
        message: `${remainingCount}/${parseInt(
          jobs.totalList.length
        )} remaining for ${uid}`,
      });
    } catch (error) {
      console.log(error);
    }
  }
});

app.get("/cancelJob", async (req, res) => {
  const jobId = req.query.jobId;
  const senderMail = req.query.senderMail as string;
  console.log(jobId);
  if (jobId != undefined) {
    await agenda.cancel({ name: jobId });
    await client.db("emails").collection(senderMail).drop();
    res.send({ status: 200, message: "Cancelled Successfully" });
  } else {
    res.send({ status: 400, message: "error occured" });
  }
});

(async () => {
  agenda.processEvery("1 minute");
  await client.connect();
  await agenda.start();

  const time = () => {
    return new Date().toTimeString().split(" ")[0];
  };

  agenda.on("start", (job) => {
    console.log(time(), `Job <${job.attrs.name}> starting`);
  });
  agenda.on("success", (job) => {
    console.log(time(), `Job <${job.attrs.name}> succeeded`);
  });
  agenda.on("fail", (error, job) => {
    console.log(time(), `Job <${job.attrs.name}> failed:`, error);
  });
})();
