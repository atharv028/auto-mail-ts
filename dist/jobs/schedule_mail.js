import nodeMailer from "nodemailer";
import { MongoClient, ServerApiVersion } from "mongodb";
const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
async function processMail(mailList, toEmails, body, subject, senderMail, senderPass, jobId, time, agenda) {
    await client.connect();
    const transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: senderMail,
            pass: senderPass,
        },
    });
    const obj = await client.db("emails").collection(senderMail).findOne({});
    console.log(obj);
    console.log("Schedule Emails called with id: " + jobId);
    if (obj === null || obj.currIndex === null) {
        if (mailList.length > 90) {
            const currList = mailList.slice(0, 90);
            await sendMail(transporter, currList, body, subject, toEmails);
            await client.db("emails").collection(senderMail).insertOne({
                currIndex: "90",
                completedList: currList,
                totalList: mailList,
                jobId: jobId,
                time: time,
            });
            await client
                .db("emails")
                .collection(senderMail)
                .deleteOne({ _id: obj._id });
        }
        else {
            await sendMail(transporter, mailList, body, subject, toEmails);
            await client.db("emails").collection(senderMail).drop();
            await agenda.disable({ name: jobId });
        }
    }
    else {
        if (parseInt(obj.currIndex) == mailList.length) {
            await client.db("emails").collection(senderMail).drop();
            await agenda.cancel({ name: jobId });
        }
        else {
            const currList = mailList.slice(parseInt(obj.currIndex), parseInt(obj.currIndex) + 90);
            await sendMail(transporter, currList, body, subject, toEmails);
            const count = parseInt(obj.currIndex) + currList.length;
            if (count == mailList.length) {
                await client.db("emails").collection(senderMail).drop();
                await agenda.cancel({ name: jobId });
            }
            else {
                await client
                    .db("emails")
                    .collection(senderMail)
                    .insertOne({
                    currIndex: count,
                    completedList: [...obj.completedList, ...currList],
                    totalList: mailList,
                    jobId: jobId,
                    time: time,
                });
                await client
                    .db("emails")
                    .collection(senderMail)
                    .deleteOne({ _id: obj._id });
            }
        }
    }
}
async function sendMail(transporter, emails, text, subject, toEmails) {
    await transporter.sendMail({
        from: "Forethought India",
        to: toEmails,
        bcc: emails,
        subject: subject,
        html: text,
    });
}
export default processMail;
//# sourceMappingURL=schedule_mail.js.map