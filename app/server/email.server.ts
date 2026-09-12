import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, verifyUrl: string) {
    await resend.emails.send({
        from: "League Fitness <onboarding@resend.dev>",
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