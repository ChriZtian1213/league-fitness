import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function sendVerificationEmail(to: string, verifyUrl: string) {
    await transporter.sendMail({
        from: `"League Fitness" <${process.env.GMAIL_USER}>`,
        to,
        subject: "Verify your League Fitness account",
        html: `
            <p>Welcome to League Fitness!</p>
            <p>Click the link below to verify your email address:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>This link expires in 24 hours.</p>
        `,
    });
}