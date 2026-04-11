import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "reminder" | "weekly_summary";
  to: string;
  name: string;
  data?: {
    assignmentName?: string;
    courseCode?: string;
    dueDate?: string;
    weight?: number;
    gpa?: number;
    completed?: number;
    dueCount?: number;
    courses?: Array<{ code: string; grade: string }>;
    aiInsight?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const { type, to, name, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to}`);

    let subject: string;
    let html: string;

    switch (type) {
      case "welcome":
        subject = "Welcome to SIGMA! 🎓";
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7C3AED; margin-bottom: 10px;">🎓 SIGMA</h1>
            </div>
            
            <h2 style="color: #1a1a1a;">Hey ${name}! 👋</h2>
            
            <p>Thanks for joining SIGMA - your AI-powered academic assistant.</p>
            
            <p><strong>Here's what you can do:</strong></p>
            <ul style="padding-left: 20px;">
              <li>📄 <strong>Upload syllabus</strong> → AI extracts everything</li>
              <li>📊 <strong>Track grades</strong> → See GPA in real-time</li>
              <li>🔮 <strong>What-If calculator</strong> → Project final grades</li>
              <li>🎯 <strong>Set goals</strong> → Get alerts when off track</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://yoursigma.ai" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #10B981); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard →</a>
            </div>
            
            <p>Good luck this semester!</p>
            <p>— The SIGMA Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #888; text-align: center;">
              SIGMA | <a href="https://yoursigma.ai" style="color: #7C3AED;">yoursigma.ai</a><br>
              <a href="https://yoursigma.ai/settings" style="color: #888;">Manage notifications</a> | 
              <a href="https://yoursigma.ai/privacy" style="color: #888;">Privacy Policy</a>
            </p>
          </body>
          </html>
        `;
        break;

      case "reminder":
        subject = `📚 Reminder: ${data?.assignmentName} due tomorrow`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7C3AED; margin-bottom: 10px;">🎓 SIGMA</h1>
            </div>
            
            <h2 style="color: #1a1a1a;">Assignment Due Tomorrow! ⏰</h2>
            
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">${data?.courseCode}</p>
              <p style="margin: 5px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${data?.assignmentName}</p>
              <p style="margin: 5px 0; color: #666;">Due: ${data?.dueDate}</p>
              <p style="margin: 5px 0; color: #7C3AED; font-weight: 500;">Weight: ${data?.weight}% of your grade</p>
            </div>
            
            <p>Don't forget to submit on time!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://yoursigma.ai/courses" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #10B981); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Course →</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #888; text-align: center;">
              <a href="https://yoursigma.ai/settings" style="color: #888;">Manage notifications</a>
            </p>
          </body>
          </html>
        `;
        break;

      case "weekly_summary":
        const courseList = data?.courses
          ?.map((c) => `<li>${c.code}: ${c.grade}</li>`)
          .join("") || "";
        
        subject = "Your SIGMA Weekly Summary 📊";
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7C3AED; margin-bottom: 10px;">🎓 SIGMA</h1>
            </div>
            
            <h2 style="color: #1a1a1a;">Hey ${name}, here's your week in review:</h2>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
              <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666;">Current GPA</p>
                <p style="margin: 5px 0; font-size: 24px; font-weight: 700; color: #7C3AED;">${data?.gpa?.toFixed(2) || "—"}</p>
              </div>
              <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666;">Completed</p>
                <p style="margin: 5px 0; font-size: 24px; font-weight: 700; color: #10B981;">${data?.completed || 0}</p>
              </div>
              <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #666;">Due This Week</p>
                <p style="margin: 5px 0; font-size: 24px; font-weight: 700; color: #F59E0B;">${data?.dueCount || 0}</p>
              </div>
            </div>
            
            ${courseList ? `
              <p><strong>Your courses:</strong></p>
              <ul style="padding-left: 20px;">${courseList}</ul>
            ` : ""}
            
            ${data?.aiInsight ? `
              <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(16, 185, 129, 0.1)); border-radius: 12px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;">💡 ${data.aiInsight}</p>
              </div>
            ` : ""}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://yoursigma.ai" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #10B981); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Dashboard →</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #888; text-align: center;">
              SIGMA | <a href="https://yoursigma.ai" style="color: #7C3AED;">yoursigma.ai</a><br>
              <a href="https://yoursigma.ai/settings" style="color: #888;">Manage notifications</a>
            </p>
          </body>
          </html>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "SIGMA <hello@yoursigma.ai>",
      reply_to: "admin@yoursigma.ai",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
