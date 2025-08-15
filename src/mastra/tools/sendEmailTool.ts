import "dotenv/config";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailTool = createTool({
  id: "send_email_summary",
  description:
    "Sends an email containing the crypto research summary to a specified recipient.",
  inputSchema: z.object({
    to: z.string().email().describe("The recipient's email address."),
    subject: z.string().describe("The subject line of the email."),
    body: z
      .string()
      .describe(
        "The HTML content of the email body, which should contain the research summary.",
      ),
    from: z
      .string()
      .email()
      .describe("The verified sender email address from your Resend account."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    emailId: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { to, subject, body, from } = context;

    console.log(`📬 Attempting to send email to: ${to}`);

    try {
      const { data, error } = await resend.emails.send({
        from: `Crypto Research Bot <${from}>`,
        to: [to],
        subject: subject,
        html: body,
      });

      if (error) {
        console.error("Resend API Error:", error);
        return {
          success: false,
          message: `Failed to send email: ${error.message}`,
        };
      }

      console.log(`✅ Email sent successfully! ID: ${data?.id}`);
      return {
        success: true,
        message: "Email sent successfully.",
        emailId: data?.id,
      };
    } catch (e) {
      const error = e as Error;
      console.error(
        "A critical error occurred while sending the email:",
        error,
      );
      return {
        success: false,
        message: `A critical error occurred: ${error.message}`,
      };
    }
  },
});
