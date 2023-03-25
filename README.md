# Automated Email Scheduler

Created a mail scheduler using Node.js and TypeScript with MongoDB as the database. The scheduler should allow users to schedule emails to be sent at a specific time in the future.

***Note:*** *This project is still a work in progress. The project is currently in the development phase.*

The mail scheduler has the following features:

* Bulk email scheduling: Users are able to schedule multiple emails to be sent at a specific time in the future without them going into spam.

* Authentication: Users are able to login using **Google App Passwords** to the application to access the mail scheduling functionality.

* Email composition: Users are able to compose emails with a subject, body, and recipient(s) fields.

* Scheduling: Users should be able to schedule emails to be sent at a specific time in the future.

* Notification: The scheduler notifies users when an email has been sent or if there was an error sending the email.

* Email history: Users are able to view a list of their scheduled and sent emails, including their status (scheduled, sent, or failed).

The application is built using Node.js and TypeScript along with AgendaJs for Scheduling Jobs. The MongoDB database stores user accounts, email compositions, and scheduling information. NodeMailer is used to send emails.

Overall, it is a mail scheduler based on Node.js and TypeScript with MongoDB which can provide a powerful and flexible solution for scheduling and sending emails.
